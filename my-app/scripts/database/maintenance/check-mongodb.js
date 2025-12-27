/**
 * MongoDB Connection Test Script
 *
 * This script tests the connection to MongoDB using the same logic as the application.
 * It helps identify issues with the MongoDB connection.
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load environment variables from .env.local if present
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].replace(/^['"](.*)['"]$/, "$1");
      }
    });
    console.log("Loaded environment variables from .env.local");
  } else {
    console.log("No .env.local file found");
  }
} catch (error) {
  console.error("Error loading environment variables:", error);
}

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "\x1b[31mERROR: MONGODB_URI is not defined in environment variables\x1b[0m"
  );
  console.log("\nPlease create a .env.local file in the project root with:");
  console.log(
    "\x1b[33mMONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/databaseName\x1b[0m"
  );
  console.log("\nOr for local development with MongoDB running locally:");
  console.log("\x1b[33mMONGODB_URI=mongodb://localhost:27017/baithaka\x1b[0m");
  process.exit(1);
}

// Test connection
console.log(
  `\nAttempting to connect to MongoDB using connection string: ${MONGODB_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    "//***:***@"
  )}`
);

async function testConnection() {
  try {
    const startTime = Date.now();

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const connectionTime = Date.now() - startTime;

    console.log("\x1b[32m✓ Successfully connected to MongoDB!\x1b[0m");
    console.log(`Connection time: ${connectionTime}ms`);
    console.log(`Database name: ${mongoose.connection.db.databaseName}`);

    // Get server information
    const admin = mongoose.connection.db.admin();
    const serverInfo = await admin.serverInfo();
    console.log(`MongoDB version: ${serverInfo.version}`);

    // List collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`\nCollections in database (${collections.length}):`);
    if (collections.length === 0) {
      console.log("  No collections found in the database");
    } else {
      collections.forEach((collection) => {
        console.log(`  - ${collection.name}`);
      });
    }

    // Check for User model
    const userCollection = collections.find(
      (c) => c.name.toLowerCase() === "users"
    );
    if (userCollection) {
      const userCount = await mongoose.connection.db
        .collection("users")
        .countDocuments();
      console.log(`\nUser collection found with ${userCount} documents`);
    } else {
      console.log(
        "\n\x1b[33mWARNING: User collection not found. The application may not work properly.\x1b[0m"
      );
    }
  } catch (error) {
    console.error("\x1b[31m✗ Failed to connect to MongoDB\x1b[0m");
    console.error(`Error: ${error.message}`);

    if (error.name === "MongoParseError") {
      console.log(
        "\nYour MongoDB connection string may be invalid. Please check the format."
      );
    } else if (error.name === "MongoServerSelectionError") {
      console.log(
        "\nCould not connect to any MongoDB server. Please check that:"
      );
      console.log("1. Your MongoDB server is running");
      console.log(
        "2. Your IP address is whitelisted in MongoDB Atlas network settings"
      );
      console.log("3. Your username and password are correct");
    }

    process.exit(1);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("\nMongoDB connection closed");
    }
  }
}

testConnection().then(() => process.exit(0));
