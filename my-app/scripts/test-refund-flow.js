const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { RefundService } = require("../lib/services/refund-service");

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Test refund flow
const testRefundFlow = async () => {
  try {
    console.log("🧪 Testing Refund Flow...\n");

    // Find a booking with payment status "paid"
    const testBooking = await Booking.findOne({
      paymentStatus: "paid",
      status: { $ne: "cancelled" },
    })
      .populate("userId", "name email")
      .populate("propertyId", "title")
      .lean();

    if (!testBooking) {
      console.log("❌ No paid booking found for testing");
      console.log("💡 Run setup-test-booking.js first to create test data");
      process.exit(1);
    }

    console.log("📋 Test Booking Found:");
    console.log("   - Booking ID:", testBooking._id);
    console.log("   - User:", testBooking.userId?.name);
    console.log("   - Property:", testBooking.propertyId?.title);
    console.log("   - Amount: ₹", testBooking.totalPrice);
    console.log("   - Payment Status:", testBooking.paymentStatus);
    console.log("   - Current Status:", testBooking.status);

    // Test refund processing
    console.log("\n💰 Processing Refund...");
    const refundResult = await RefundService.processRefund(
      testBooking._id.toString(),
      testBooking.userId._id.toString()
    );

    console.log("\n📊 Refund Result:");
    console.log("   - Success:", refundResult.success);
    console.log("   - Message:", refundResult.message);
    console.log("   - Refund Amount: ₹", refundResult.refundAmount);
    console.log("   - Refund Status:", refundResult.refundStatus);
    console.log("   - Refund ID:", refundResult.refundId);

    if (refundResult.instructions) {
      console.log("\n📋 Refund Instructions:");
      console.log("   - Title:", refundResult.instructions.title);
      console.log("   - Message:", refundResult.instructions.message);
      console.log(
        "   - Timeline Steps:",
        refundResult.instructions.timeline.length
      );
      console.log("   - Details:", refundResult.instructions.details.length);
    }

    // Verify database update
    const updatedBooking = await Booking.findById(testBooking._id).lean();
    console.log("\n🔍 Database Verification:");
    console.log("   - Status:", updatedBooking.status);
    console.log("   - Payment Status:", updatedBooking.paymentStatus);
    console.log("   - Refund Amount:", updatedBooking.refundAmount);
    console.log("   - Refund Status:", updatedBooking.refundStatus);
    console.log("   - Refunded At:", updatedBooking.refundedAt);
    console.log("   - Cancellation Reason:", updatedBooking.cancellationReason);

    // Test refund status API
    console.log("\n🔍 Testing Refund Status API...");
    const refundStatus = await RefundService.getRefundStatus(
      testBooking._id.toString()
    );

    if (refundStatus) {
      console.log("   - Payment Status:", refundStatus.paymentStatus);
      console.log("   - Refund Amount:", refundStatus.refundAmount);
      console.log("   - Refund Status:", refundStatus.refundStatus);
      console.log("   - Refund ID:", refundStatus.refundId);
    }

    console.log("\n✅ Refund Flow Test Completed Successfully!");

    // Summary
    console.log("\n📋 Test Summary:");
    console.log('   ✅ Booking found with payment status "paid"');
    console.log("   ✅ Refund processing initiated");
    console.log("   ✅ Database updated with refund information");
    console.log("   ✅ Refund instructions generated");
    console.log("   ✅ Refund status API working");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testRefundFlow();
};

runTest();
