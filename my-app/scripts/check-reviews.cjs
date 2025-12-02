const mongoose = require('mongoose');

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/";

async function checkReviews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define Review schema (simplified)
    const ReviewSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      userName: { type: String, required: true },
      userImage: { type: String },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      source: { type: String },
      isVerified: { type: Boolean, default: false },
      isPublished: { type: Boolean, default: true },
      helpfulCount: { type: Number, default: 0 },
    }, { timestamps: true, collection: "reviews" });

    const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

    // Get all reviews
    const allReviews = await Review.find({}).lean();
    console.log(`\n📊 Total reviews in database: ${allReviews.length}`);

    if (allReviews.length === 0) {
      console.log('⚠️  No reviews found in the database!');
      console.log('   This means you need to add reviews first.');
    } else {
      console.log('\n📋 Review breakdown:');

      // Group by property
      const byProperty = {};
      const byStatus = { published: 0, unpublished: 0 };

      allReviews.forEach(review => {
        const propId = review.propertyId.toString();
        if (!byProperty[propId]) {
          byProperty[propId] = [];
        }
        byProperty[propId].push(review);

        if (review.isPublished) {
          byStatus.published++;
        } else {
          byStatus.unpublished++;
        }
      });

      console.log(`   - Published: ${byStatus.published}`);
      console.log(`   - Unpublished: ${byStatus.unpublished}`);
      console.log(`   - Properties with reviews: ${Object.keys(byProperty).length}`);

      console.log('\n📍 Reviews per property:');
      for (const [propId, reviews] of Object.entries(byProperty)) {
        const published = reviews.filter(r => r.isPublished).length;
        const unpublished = reviews.filter(r => !r.isPublished).length;
        console.log(`   Property ${propId}:`);
        console.log(`     - Total: ${reviews.length} (${published} published, ${unpublished} unpublished)`);
      }

      // Show first few reviews
      console.log('\n📝 Sample reviews (first 5):');
      allReviews.slice(0, 5).forEach((review, index) => {
        console.log(`\n   ${index + 1}. ${review.userName} (${review.rating}★)`);
        console.log(`      Property ID: ${review.propertyId}`);
        console.log(`      Published: ${review.isPublished ? '✅' : '❌'}`);
        console.log(`      Comment: ${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkReviews();
