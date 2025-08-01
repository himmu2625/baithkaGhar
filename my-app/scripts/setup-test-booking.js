const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Property = require("../models/Property");

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

// Create test user if doesn't exist
const createTestUser = async () => {
  try {
    let testUser = await User.findOne({ email: "test@baithaka.com" });

    if (!testUser) {
      testUser = await User.create({
        name: "Test User",
        email: "test@baithaka.com",
        password: "testpassword123",
        role: "user",
        profileComplete: true,
        phone: "+91-9876543210",
      });
      console.log("✅ Test user created:", testUser.email);
    } else {
      console.log("✅ Test user already exists:", testUser.email);
    }

    return testUser;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  }
};

// Create test property if doesn't exist
const createTestProperty = async () => {
  try {
    let testProperty = await Property.findOne({
      title: "Test Property for Booking Flow",
    });

    if (!testProperty) {
      testProperty = await Property.create({
        title: "Test Property for Booking Flow",
        description: "A test property for testing the complete booking flow",
        address: "123 Test Street, Test City, Test State 123456",
        city: "Test City",
        state: "Test State",
        pricePerNight: 2500,
        images: ["https://via.placeholder.com/400x300?text=Test+Property"],
        amenities: ["WiFi", "AC", "Kitchen"],
        ownerId: new mongoose.Types.ObjectId(), // Create a dummy owner
        status: "active",
        propertyType: "apartment",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
      });
      console.log("✅ Test property created:", testProperty.title);
    } else {
      console.log("✅ Test property already exists:", testProperty.title);
    }

    return testProperty;
  } catch (error) {
    console.error("❌ Error creating test property:", error);
    throw error;
  }
};

// Create test booking with payment status
const createTestBooking = async (userId, propertyId) => {
  try {
    // Check if test booking already exists
    let testBooking = await Booking.findOne({
      userId: userId._id,
      propertyId: propertyId._id,
      paymentStatus: "paid",
    });

    if (!testBooking) {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 7); // 7 days from now

      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 nights stay

      testBooking = await Booking.create({
        userId: userId._id,
        propertyId: propertyId._id,
        status: "confirmed",
        dateFrom: checkInDate,
        dateTo: checkOutDate,
        guests: 2,
        totalPrice: 7500, // 3 nights * 2500
        originalAmount: 7500,
        pricePerNight: 2500,
        propertyName: propertyId.title,
        contactDetails: {
          name: userId.name,
          email: userId.email,
          phone: userId.phone,
        },
        paymentStatus: "paid",
        paymentId: "pay_test_" + Date.now(), // Mock Razorpay payment ID
        paymentSessionId: "session_test_" + Date.now(),
        paymentIntentId: "pi_test_" + Date.now(),
      });

      console.log('✅ Test booking created with payment status "paid":');
      console.log("   - Booking ID:", testBooking._id);
      console.log("   - Payment ID:", testBooking.paymentId);
      console.log("   - Total Amount: ₹", testBooking.totalPrice);
      console.log("   - Check-in:", testBooking.dateFrom.toDateString());
      console.log("   - Check-out:", testBooking.dateTo.toDateString());
    } else {
      console.log('✅ Test booking already exists with payment status "paid"');
      console.log("   - Booking ID:", testBooking._id);
      console.log("   - Payment ID:", testBooking.paymentId);
    }

    return testBooking;
  } catch (error) {
    console.error("❌ Error creating test booking:", error);
    throw error;
  }
};

// Main setup function
const setupTestData = async () => {
  try {
    console.log("🚀 Setting up test data for booking flow...\n");

    await connectDB();

    const testUser = await createTestUser();
    const testProperty = await createTestProperty();
    const testBooking = await createTestBooking(testUser, testProperty);

    console.log("\n✅ Test data setup completed successfully!");
    console.log("\n📋 Test Data Summary:");
    console.log("   - Test User:", testUser.email);
    console.log("   - Test Property:", testProperty.title);
    console.log("   - Test Booking ID:", testBooking._id);
    console.log("   - Payment Status: paid");
    console.log("   - Amount: ₹", testBooking.totalPrice);

    console.log("\n🎯 Ready for testing! You can now:");
    console.log("   1. Login with test@baithaka.com");
    console.log("   2. Go to /bookings to see the test booking");
    console.log("   3. Cancel the booking to test refund flow");

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
};

// Run the setup
setupTestData();
