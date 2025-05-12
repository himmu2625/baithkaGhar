/**
 * Cleanup Database Script
 *
 * This script removes all test properties from the database before deployment.
 * Run this script before deploying the application to production.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { exit } from "process";

// Load environment variables
dotenv.config({ path: ".env.local" });

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  console.log("Please create a .env.local file with MONGODB_URI defined");
  exit(1);
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    exit(1);
  }
}

// Load Property model
async function loadModel() {
  try {
    // Define Property schema if it doesn't exist
    if (!mongoose.models.Property) {
      const PropertySchema = new mongoose.Schema(
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
          verificationStatus: String,
          status: String,
          isPublished: Boolean,
        },
        { strict: false }
      );

      mongoose.model("Property", PropertySchema);
    }
    return mongoose.models.Property;
  } catch (error) {
    console.error("Failed to load Property model:", error);
    exit(1);
  }
}

// Remove all properties
async function cleanupDatabase() {
  try {
    const Property = await loadModel();

    console.log("Removing all test properties...");

    // Option 1: Mark all properties as deleted
    const updateResult = await Property.updateMany(
      {}, // Match all documents
      {
        status: "deleted",
        isPublished: false,
        verificationStatus: "rejected",
      }
    );

    console.log(
      `Updated ${updateResult.modifiedCount} properties to deleted status`
    );

    // Option 2: Delete all properties (uncomment if you want to physically remove them)
    /*
    const deleteResult = await Property.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} properties`);
    */

    console.log("Database cleanup completed successfully");
  } catch (error) {
    console.error("Error cleaning up database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the script
(async () => {
  try {
    await connectToMongoDB();
    await cleanupDatabase();
    console.log("All done! Database cleaned up for deployment.");
    exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    exit(1);
  }
})();
