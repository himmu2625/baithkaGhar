/**
 * Fix City Property Counts Script
 *
 * This script fixes the double-counting issue by:
 * 1. Recalculating accurate property counts for all cities
 * 2. Updating city records with correct counts
 * 3. Removing cities with 0 properties (optional)
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

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
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
        new mongoose.Schema({
          isPublished: Boolean,
          verificationStatus: String,
          status: String,
          address: {
            city: String,
          },
          city: String, // Legacy field
          propertyType: String,
        })
      );

    const City =
      mongoose.models.City ||
      mongoose.model(
        "City",
        new mongoose.Schema({
          name: String,
          properties: Number,
          image: String,
          updatedAt: Date,
        })
      );

    return { Property, City };
  } catch (error) {
    console.error("Error loading models:", error);
    process.exit(1);
  }
};

// Main function to fix city property counts
const fixCityCounts = async () => {
  try {
    await connectDB();
    const { Property, City } = await loadModels();

    console.log("🔧 Starting city property count fix...\n");

    // Get all cities
    const cities = await City.find({});
    console.log(`📊 Found ${cities.length} cities to check\n`);

    const results = [];

    for (const city of cities) {
      const cityName = city.name;
      console.log(`🔍 Processing city: ${cityName}`);

      // Count actual active properties in this city
      const cityRegex = new RegExp(cityName, "i");
      const actualCount = await Property.countDocuments({
        isPublished: true,
        verificationStatus: "approved",
        status: "available",
        $or: [
          { "address.city": cityRegex },
          { city: cityRegex }, // Legacy field support
        ],
      });

      const oldCount = city.properties || 0;

      // Update the city with correct count
      await City.findByIdAndUpdate(city._id, {
        properties: actualCount,
        updatedAt: new Date(),
      });

      const status =
        oldCount === actualCount
          ? "✅ CORRECT"
          : oldCount > actualCount
          ? "🔧 FIXED (was too high)"
          : "🔧 FIXED (was too low)";

      console.log(`   Stored count: ${oldCount}`);
      console.log(`   Actual count: ${actualCount}`);
      console.log(`   Status: ${status}\n`);

      results.push({
        cityName,
        oldCount,
        actualCount,
        wasFixed: oldCount !== actualCount,
      });
    }

    // Summary
    console.log("📈 SUMMARY:");
    console.log("=".repeat(50));

    const fixedCities = results.filter((r) => r.wasFixed);
    const correctCities = results.filter((r) => !r.wasFixed);

    console.log(`✅ Cities with correct counts: ${correctCities.length}`);
    console.log(`🔧 Cities that were fixed: ${fixedCities.length}`);

    if (fixedCities.length > 0) {
      console.log("\n🔧 Fixed cities:");
      fixedCities.forEach((city) => {
        console.log(
          `   ${city.cityName}: ${city.oldCount} → ${city.actualCount}`
        );
      });
    }

    // Check for cities with 0 properties
    const emptyCities = results.filter((r) => r.actualCount === 0);
    if (emptyCities.length > 0) {
      console.log(`\n⚠️  Cities with 0 properties (${emptyCities.length}):`);
      emptyCities.forEach((city) => {
        console.log(`   ${city.cityName}`);
      });
      console.log(
        "   Consider removing these cities or they will show 0 properties on frontend"
      );
    }

    console.log("\n🎉 City count fix completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing city counts:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔐 Database connection closed");
  }
};

// Run the fix
fixCityCounts();
