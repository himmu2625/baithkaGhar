import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Initialize dotenv
dotenv.config();

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try different connection strings to handle various MongoDB setups
const possibleUris = [
  process.env.MONGODB_URI,
  "mongodb://127.0.0.1:27017/baithaka",
  "mongodb://localhost:27017/baithaka",
  "mongodb://0.0.0.0:27017/baithaka",
  "mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/",
];

// Define User Schema for fetching data
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    password: String,
    address: String,
    dob: Date,
    isAdmin: Boolean,
    role: String,
    permissions: [String],
    googleId: String,
    profileComplete: Boolean,
    createdAt: Date,
    updatedAt: Date,
  },
  {
    collection: "users",
    timestamps: true,
  }
);

async function tryConnect(uri) {
  try {
    console.log(`Attempting to connect to: ${uri}`);
    await mongoose.connect(uri);
    console.log(`Successfully connected to: ${uri}`);
    return true;
  } catch (error) {
    console.log(`Failed to connect to: ${uri}`);
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function exportLocalUsers() {
  let connected = false;

  try {
    console.log("Starting MongoDB connection attempts...");

    // Try each connection string until one works
    for (const uri of possibleUris.filter(Boolean)) {
      connected = await tryConnect(uri);
      if (connected) break;
    }

    if (!connected) {
      throw new Error(
        "Could not connect to any MongoDB instance. Please ensure MongoDB is running."
      );
    }

    console.log("Connected to MongoDB. Exporting users...");

    // Define model
    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Get all users, exclude sensitive data
    const users = await User.find({}).select({
      name: 1,
      email: 1,
      phone: 1,
      address: 1,
      dob: 1,
      isAdmin: 1,
      role: 1,
      permissions: 1,
      googleId: 1,
      profileComplete: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (users.length === 0) {
      console.log("No users found in the database.");
    } else {
      // Create export data
      const exportData = {
        users,
        exportToken:
          Date.now().toString(36) + Math.random().toString(36).substring(2),
        exportedAt: new Date().toISOString(),
        count: users.length,
        source: "local-export-script",
      };

      // Create export directory if it doesn't exist
      const exportDir = path.join(__dirname, "../exports");
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Write to file
      const filePath = path.join(
        exportDir,
        `users-export-${new Date().toISOString().slice(0, 10)}.json`
      );
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

      console.log(
        `Export successful! ${users.length} users exported to: ${filePath}`
      );
      console.log("To import these users to your deployed site:");
      console.log("1. Go to Admin > User Migration in your admin panel");
      console.log("2. Click on the 'Import' tab");
      console.log("3. Copy and paste the contents of the exported JSON file");
      console.log("4. Click 'Import Users'");
    }
  } catch (error) {
    console.error("Error exporting users:", error);
    console.log("\nPlease check that:");
    console.log("1. MongoDB is running on your local machine");
    console.log("2. The database name 'baithaka' is correct");
    console.log("3. Your MongoDB connection URL is correct");
    console.log(
      "4. You have MongoDB installed and it's running on the default port 27017"
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the export
exportLocalUsers();
