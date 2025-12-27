const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

async function updateTravelPicks() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    // Use existing models
    const Property =
      mongoose.models.Property || require("../models/Property.ts").default;
    const Booking =
      mongoose.models.Booking || require("../models/Booking.ts").default;
    const TravelPick =
      mongoose.models.TravelPick || require("../models/TravelPick.ts").default;

    console.log("Calculating property scores based on current metrics...");

    // Get all published and available properties
    const properties = await Property.find({
      isPublished: true,
      isAvailable: true,
      verificationStatus: "approved",
    }).lean();

    console.log(`Analyzing ${properties.length} properties...`);

    const propertyScores = [];

    for (const property of properties) {
      // Get booking metrics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ["confirmed", "completed"] },
        createdAt: { $gte: thirtyDaysAgo },
      });

      const totalBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ["confirmed", "completed"] },
      });

      // Calculate revenue from bookings
      const bookingRevenue = await Booking.aggregate([
        {
          $match: {
            propertyId: property._id,
            status: { $in: ["confirmed", "completed"] },
            totalPrice: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]);

      const revenue =
        bookingRevenue.length > 0 ? bookingRevenue[0].totalRevenue : 0;

      // Calculate occupancy rate (simplified - based on bookings vs time available)
      const daysActive = Math.max(
        1,
        Math.floor((new Date() - property.createdAt) / (1000 * 60 * 60 * 24))
      );
      const occupancyRate = Math.min(totalBookings / (daysActive / 30), 1); // Rough occupancy calculation

      // Calculate score based on multiple factors with weights
      const weights = {
        rating: 0.25, // 25% weight
        reviews: 0.15, // 15% weight
        bookings: 0.3, // 30% weight
        recent: 0.2, // 20% weight
        revenue: 0.1, // 10% weight
      };

      const ratingScore = (property.rating || 0) * 20; // Max 100 points (5 * 20)
      const reviewScore = Math.min((property.reviewCount || 0) * 2, 100); // Max 100 points
      const bookingScore = Math.min(totalBookings * 10, 100); // Max 100 points
      const recentBookingScore = Math.min(recentBookings * 20, 100); // Max 100 points
      const revenueScore = Math.min(revenue / 1000, 100); // Max 100 points

      const totalScore =
        ratingScore * weights.rating +
        reviewScore * weights.reviews +
        bookingScore * weights.bookings +
        recentBookingScore * weights.recent +
        revenueScore * weights.revenue;

      propertyScores.push({
        propertyId: property._id,
        propertyTitle: property.title,
        score: totalScore,
        metrics: {
          rating: property.rating || 0,
          reviewCount: property.reviewCount || 0,
          bookingCount: totalBookings,
          recentBookings,
          revenue,
          occupancyRate,
        },
      });
    }

    // Sort by score and take top 5
    propertyScores.sort((a, b) => b.score - a.score);
    const top5Properties = propertyScores.slice(0, 5);

    console.log("\n🏆 Top 5 Properties by Score:");
    top5Properties.forEach((prop, index) => {
      console.log(
        `${index + 1}. ${prop.propertyTitle} (Score: ${prop.score.toFixed(2)})`
      );
      console.log(
        `   Rating: ${prop.metrics.rating.toFixed(1)}, Reviews: ${
          prop.metrics.reviewCount
        }, Bookings: ${prop.metrics.bookingCount}, Recent: ${
          prop.metrics.recentBookings
        }`
      );
    });

    // Clear existing travel picks
    await TravelPick.updateMany({}, { isActive: false });

    // Create new travel picks
    const newTravelPicks = top5Properties.map((prop, index) => ({
      propertyId: prop.propertyId,
      rank: index + 1,
      score: prop.score,
      metrics: prop.metrics,
      isActive: true,
    }));

    await TravelPick.insertMany(newTravelPicks);

    console.log("\n✅ Travel picks updated successfully!");
    console.log(`📊 Updated rankings based on:
    - Property ratings and reviews
    - Total booking count  
    - Recent bookings (last 30 days)
    - Total revenue generated
    - Occupancy rates`);

    console.log(
      "\n📝 The website will now display these updated travel picks."
    );
  } catch (error) {
    console.error("❌ Error updating travel picks:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

// Run the update
updateTravelPicks();
