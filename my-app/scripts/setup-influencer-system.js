/**
 * Influencer Partnership System Setup Script
 * Run this script after implementing the influencer system to:
 * 1. Create database indexes
 * 2. Verify system configuration
 * 3. Create sample data (optional)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: ".env.local" });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

async function setupInfluencerSystem() {
  console.log("🚀 Setting up Influencer Partnership System...\n");

  try {
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // 1. Create Indexes
    console.log("📊 Creating database indexes...");

    // Influencer indexes
    await db
      .collection("influencers")
      .createIndex({ referralCode: 1 }, { unique: true, background: true });
    await db
      .collection("influencers")
      .createIndex({ status: 1, createdAt: -1 }, { background: true });
    await db
      .collection("influencers")
      .createIndex(
        { email: 1 },
        { unique: true, sparse: true, background: true }
      );
    console.log("  ✓ Influencer indexes created");

    // ReferralClick indexes
    await db
      .collection("referralclicks")
      .createIndex({ influencerId: 1, clickedAt: -1 }, { background: true });
    await db
      .collection("referralclicks")
      .createIndex({ sessionId: 1 }, { background: true });
    await db
      .collection("referralclicks")
      .createIndex(
        { conversionStatus: 1, influencerId: 1 },
        { background: true }
      );
    console.log("  ✓ ReferralClick indexes created");

    // Payout indexes
    await db
      .collection("payouts")
      .createIndex({ influencerId: 1, status: 1 }, { background: true });
    await db
      .collection("payouts")
      .createIndex({ status: 1, requestedAt: -1 }, { background: true });
    console.log("  ✓ Payout indexes created");

    // Booking indexes (extending existing)
    await db
      .collection("bookings")
      .createIndex(
        { influencerId: 1, createdAt: -1 },
        { background: true, sparse: true }
      );
    await db
      .collection("bookings")
      .createIndex(
        { commissionPaid: 1, influencerId: 1 },
        { background: true, sparse: true }
      );
    console.log("  ✓ Booking influencer indexes created\n");

    // 2. Verify Configuration
    console.log("🔧 Verifying system configuration...");

    const requiredEnvVars = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.warn(
        `⚠️  Missing environment variables: ${missingVars.join(", ")}`
      );
    } else {
      console.log("  ✓ All required environment variables present");
    }

    // Check optional influencer-specific vars
    const influencerVars = {
      CRON_SECRET:
        process.env.CRON_SECRET || "Not set (recommended for production)",
      INFLUENCER_MIN_PAYOUT:
        process.env.INFLUENCER_MIN_PAYOUT || "100 (default)",
      INFLUENCER_TDS_RATE: process.env.INFLUENCER_TDS_RATE || "0.10 (default)",
    };

    console.log("  📋 Influencer system configuration:");
    Object.entries(influencerVars).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });
    console.log("");

    // 3. Check existing data
    console.log("📈 Checking existing data...");

    const counts = await Promise.all([
      db
        .collection("users")
        .countDocuments({ role: { $in: ["admin", "super_admin"] } }),
      db.collection("properties").countDocuments(),
      db.collection("bookings").countDocuments(),
      db.collection("influencers").countDocuments(),
      db.collection("payouts").countDocuments(),
    ]);

    console.log(`  📊 Current data counts:`);
    console.log(`    Admin users: ${counts[0]}`);
    console.log(`    Properties: ${counts[1]}`);
    console.log(`    Bookings: ${counts[2]}`);
    console.log(`    Influencers: ${counts[3]}`);
    console.log(`    Payouts: ${counts[4]}\n`);

    // 4. Create sample influencer (optional)
    const createSample = process.argv.includes("--create-sample");

    if (createSample) {
      console.log("🎭 Creating sample influencer...");

      const sampleInfluencer = {
        name: "Travel Guru",
        email: "sample@travelguru.com",
        platform: "youtube",
        handle: "@travelguru",
        followerCount: 50000,
        niche: "travel",
        referralCode: "TRAVEL2024",
        commissionType: "percentage",
        commissionRate: 5,
        totalEarnings: 0,
        walletBalance: 0,
        totalClicks: 0,
        totalBookings: 0,
        totalRevenue: 0,
        status: "pending",
        bankDetails: {
          accountNumber: "1234567890",
          ifscCode: "HDFC0001234",
          accountName: "Travel Guru",
          bankName: "HDFC Bank",
        },
        notes: "Sample influencer created by setup script",
        tags: ["travel", "budget", "backpacking"],
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check if sample already exists
      const existing = await db.collection("influencers").findOne({
        referralCode: "TRAVEL2024",
      });

      if (!existing) {
        await db.collection("influencers").insertOne(sampleInfluencer);
        console.log("  ✓ Sample influencer created: TRAVEL2024");
        console.log("  📋 Test URL: https://yoursite.com?ref=TRAVEL2024");
      } else {
        console.log("  ⚠️  Sample influencer already exists");
      }
      console.log("");
    }

    // 5. System status
    console.log("🎯 System Status Summary:");
    console.log("  ✅ Database indexes created");
    console.log("  ✅ Configuration verified");
    console.log("  ✅ Data structure ready");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("  1. Deploy your application");
    console.log("  2. Access /admin/influencers to create influencers");
    console.log("  3. Set up cron job for monthly payouts");
    console.log("  4. Test referral tracking with ?ref=CODE URLs");
    console.log(
      "  5. Review the setup documentation in INFLUENCER_PARTNERSHIP_SETUP.md"
    );
    console.log("");
    console.log("📚 Documentation: ./INFLUENCER_PARTNERSHIP_SETUP.md");
    console.log("🔧 Admin Panel: /admin/influencers");
    console.log("💰 Payouts: /admin/payouts");
    console.log("");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Setup completed successfully!");
  }
}

// Helper function to check if script is run directly
function isMainModule() {
  return require.main === module;
}

// Run setup if script is executed directly
if (isMainModule()) {
  console.log("Influencer Partnership System Setup");
  console.log("=====================================\n");

  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/setup-influencer-system.js [options]");
    console.log("");
    console.log("Options:");
    console.log("  --create-sample  Create a sample influencer for testing");
    console.log("  --help           Show this help message");
    console.log("");
    process.exit(0);
  }

  setupInfluencerSystem().catch(console.error);
}

module.exports = { setupInfluencerSystem };
