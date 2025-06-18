const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Property Schema (simplified for script)
const PropertySchema = new mongoose.Schema({
  title: String,
  location: String,
  price: { base: Number },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  verificationStatus: { type: String, default: "pending" },
});

// TravelPick Schema (simplified for script)
const TravelPickSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    rank: Number,
    score: Number,
    metrics: {
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      bookingCount: { type: Number, default: 0 },
      recentBookings: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      occupancyRate: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function initializeTravelPicks() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    const Property =
      mongoose.models.Property || mongoose.model("Property", PropertySchema);
    const TravelPick =
      mongoose.models.TravelPick ||
      mongoose.model("TravelPick", TravelPickSchema);

    console.log("Fetching first 5 published and available properties...");

    // Get first 5 published and available properties
    const properties = await Property.find({
      isPublished: true,
      isAvailable: true,
      verificationStatus: "approved",
    })
      .sort({ createdAt: 1 }) // Oldest first for initial setup
      .limit(5)
      .lean();

    if (properties.length === 0) {
      console.log(
        "No published and approved properties found. Creating sample travel picks..."
      );

      // If no properties exist, create sample data structure
      console.log(
        "Please make sure you have at least 5 published and approved properties in your database."
      );
      return;
    }

    console.log(
      `Found ${properties.length} properties to initialize as travel picks`
    );

    // Clear existing travel picks
    await TravelPick.deleteMany({});

    // Create initial travel picks
    const initialTravelPicks = properties.map((property, index) => ({
      propertyId: property._id,
      rank: index + 1,
      score: 50 + Math.random() * 50, // Random initial score between 50-100
      metrics: {
        rating: property.rating || 4.0 + Math.random() * 1, // Default rating between 4-5
        reviewCount:
          property.reviewCount || Math.floor(Math.random() * 50) + 10,
        bookingCount: Math.floor(Math.random() * 20) + 5,
        recentBookings: Math.floor(Math.random() * 5) + 1,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        occupancyRate: Math.random() * 0.3 + 0.7, // 70-100% occupancy
      },
      isActive: true,
    }));

    await TravelPick.insertMany(initialTravelPicks);

    console.log("✅ Travel picks initialized successfully!");
    console.log("Initial travel picks:");

    for (let i = 0; i < initialTravelPicks.length; i++) {
      const pick = initialTravelPicks[i];
      const property = properties[i];
      console.log(
        `${pick.rank}. ${property.title} (Score: ${pick.score.toFixed(2)})`
      );
    }

    console.log("\n📝 Next steps:");
    console.log(
      "1. The travel picks component will now show these initial properties"
    );
    console.log(
      "2. As bookings start coming in, run the update script to refresh travel picks"
    );
    console.log(
      "3. You can also manually update travel picks through the admin panel"
    );
  } catch (error) {
    console.error("❌ Error initializing travel picks:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

// Run the initialization
initializeTravelPicks();
