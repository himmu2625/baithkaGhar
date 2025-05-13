/**
 * Script to update city property counts
 *
 * This script updates the property counts for all cities based on the
 * actual number of properties in the database with matching city names.
 *
 * Usage:
 * - node scripts/update-city-counts.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the my-app directory (parent of scripts)
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// MongoDB connection string - use environment variable or fallback to a default value
// Use the same connection string format as in your production environment
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/baithaka";

console.log(
  "Using MongoDB URI:",
  MONGODB_URI.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
    "mongodb+srv://****:****@"
  )
);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Load models (dynamically to avoid needing to transpile TypeScript)
const loadModels = async () => {
  try {
    // Simple model loader that will work with ESM
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

// Main function to update city property counts
const updateCityCounts = async () => {
  try {
    // Connect to database
    await connectDB();

    // Load models
    const { Property, City } = await loadModels();

    console.log("Starting city property count update...");

    // Get all cities
    const cities = await City.find({});
    console.log(`Found ${cities.length} cities to update`);

    // For each city, count properties and update
    for (const city of cities) {
      // Get the city name
      const cityName = city.name;
      console.log(`Processing city: ${cityName}`);

      // Count properties in this city
      const cityRegex = new RegExp(cityName, "i");
      const propertyCount = await Property.countDocuments({
        isPublished: true,
        verificationStatus: "approved",
        status: "available",
        $or: [{ "address.city": cityRegex }, { city: cityRegex }],
      });

      // Update the city with the new count
      const oldCount = city.properties || 0;
      const updatedCity = await City.findByIdAndUpdate(
        city._id,
        { properties: propertyCount, updatedAt: new Date() },
        { new: true }
      );

      console.log(
        `Updated ${cityName}: ${oldCount} → ${propertyCount} properties`
      );
    }

    console.log("City property count update completed successfully");
  } catch (error) {
    console.error("Error updating city property counts:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the update function
updateCityCounts();
