const mongoose = require("mongoose");

// Debug property validation issues
async function debugPropertyValidation() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Import the Property model
    const Property = require("../models/Property").default;

    // Test data that might be causing issues
    const testData = {
      title: "Test Property",
      name: "Test Property",
      description: "A test property for debugging",
      location: "Test City, Test State, India",
      address: {
        street: "123 Test Street",
        city: "Test City",
        state: "Test State",
        zipCode: "123456",
        country: "India",
      },
      price: {
        base: 1500,
      },
      contactNo: "1234567890",
      email: "test@example.com",
      propertyType: "apartment",
      generalAmenities: {
        wifi: true,
        tv: false,
        kitchen: true,
        parking: false,
        ac: true,
        pool: false,
        geyser: true,
        shower: true,
        bathTub: false,
        reception24x7: false,
        roomService: false,
        restaurant: false,
        bar: false,
        pub: false,
        fridge: true,
      },
      categorizedImages: [],
      legacyGeneralImages: [],
      propertyUnits: [],
      bedrooms: 2,
      bathrooms: 1,
      beds: 2,
      maxGuests: 4,
      pricing: {
        perNight: "1500",
        perWeek: "10000",
        perMonth: "40000",
      },
      totalHotelRooms: "0",
      status: "available",
      policyDetails: "Standard policies apply",
      minStay: "1",
      maxStay: "30",
      propertySize: "800 sq ft",
      availability: "available",
      stayTypes: ["family-stay"],
      userId: new mongoose.Types.ObjectId(),
      hostId: new mongoose.Types.ObjectId(),
      isPublished: false,
      isAvailable: true,
      rating: 0,
      reviewCount: 0,
      verificationStatus: "pending",
    };

    console.log("Testing property validation with data:", {
      stayTypes: testData.stayTypes,
      propertyType: testData.propertyType,
      generalAmenities: Object.keys(testData.generalAmenities).filter(
        (k) => testData.generalAmenities[k]
      ),
    });

    // Create and validate the property
    const property = new Property(testData);

    // Validate before saving
    const validationError = property.validateSync();
    if (validationError) {
      console.error("Validation failed:", validationError.errors);
      Object.keys(validationError.errors).forEach((key) => {
        console.error(`- ${key}: ${validationError.errors[key].message}`);
      });
    } else {
      console.log("✅ Validation passed!");

      // Try to save
      try {
        await property.save();
        console.log("✅ Property saved successfully!");

        // Clean up - delete the test property
        await Property.findByIdAndDelete(property._id);
        console.log("✅ Test property cleaned up");
      } catch (saveError) {
        console.error("❌ Save failed:", saveError.message);
        if (saveError.name === "ValidationError") {
          Object.keys(saveError.errors).forEach((key) => {
            console.error(`- ${key}: ${saveError.errors[key].message}`);
          });
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the debug function
debugPropertyValidation().catch(console.error);
