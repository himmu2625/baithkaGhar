const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// MongoDB URI
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/baithaka";

// Define User Schema for importing
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["super_admin", "admin", "user", "host"],
      default: "user",
    },
    permissions: [{ type: String }],
    googleId: { type: String },
    profileComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

async function importUsers() {
  const args = process.argv.slice(2);
  const jsonFilePath =
    args[0] || path.join(__dirname, "../exports/sample-users.json");

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: File not found: ${jsonFilePath}`);
    console.log(
      "Please specify a valid JSON file path as an argument or use the default sample users file."
    );
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log(
      `Connecting to MongoDB at ${MONGODB_URI.replace(
        /\/\/([^:]+):([^@]+)@/,
        "//***:***@"
      )}...`
    );
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully");

    // Read JSON file
    const jsonData = fs.readFileSync(jsonFilePath, "utf8");
    const userData = JSON.parse(jsonData);

    if (!userData.users || !Array.isArray(userData.users)) {
      throw new Error(
        'Invalid JSON format. Expected a "users" array in the JSON data.'
      );
    }

    // Initialize User model
    const User = mongoose.model("User", UserSchema);

    // Process users
    console.log(`Found ${userData.users.length} users in the JSON file.`);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const user of userData.users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          // Update existing user
          Object.assign(existingUser, user);
          await existingUser.save();
          updated++;
          console.log(`✓ Updated user: ${user.name} (${user.email})`);
        } else {
          // Create new user
          await User.create(user);
          imported++;
          console.log(`✓ Imported user: ${user.name} (${user.email})`);
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error with user ${user.email}: ${error.message}`);
      }
    }

    console.log("\n--- Import Summary ---");
    console.log(`Total users in file: ${userData.users.length}`);
    console.log(`Newly imported: ${imported}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error("Import failed:", error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the import function
importUsers().catch(console.error);
