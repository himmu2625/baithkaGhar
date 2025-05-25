// Test script to verify booking flow
const testBookingFlow = async () => {
  const baseUrl = "http://localhost:3000";

  // Test booking data with correct field names
  const testBookingData = {
    propertyId: "507f1f77bcf86cd799439011", // Mock ObjectId
    dateFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    dateTo: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    guests: 2,
    pricePerNight: 1500,
    totalPrice: 4500,
    propertyName: "Test Property",
    contactDetails: {
      name: "Test User",
      email: "test@example.com",
      phone: "+91 9876543210",
    },
    specialRequests: "Test booking request",
  };

  console.log("Testing booking creation with data:", testBookingData);

  try {
    // Test the booking API endpoint
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: In real scenario, this would need authentication headers
      },
      body: JSON.stringify(testBookingData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Booking creation successful:", result);
      return result._id || result.id;
    } else {
      console.log("❌ Booking creation failed:", result);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing booking flow:", error);
    return null;
  }
};

// Test individual booking retrieval
const testBookingRetrieval = async (bookingId) => {
  const baseUrl = "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
      headers: {
        // Note: In real scenario, this would need authentication headers
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Booking retrieval successful:", result);
    } else {
      console.log("❌ Booking retrieval failed:", result);
    }
  } catch (error) {
    console.error("❌ Error retrieving booking:", error);
  }
};

// Run the tests
const runTests = async () => {
  console.log("🧪 Starting booking flow tests...\n");

  const bookingId = await testBookingFlow();

  if (bookingId) {
    console.log("\n🧪 Testing booking retrieval...");
    await testBookingRetrieval(bookingId);
  }

  console.log("\n✅ Booking flow tests completed!");
};

// Export for use in Node.js or browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testBookingFlow, testBookingRetrieval, runTests };
} else {
  // Browser environment
  window.testBookingFlow = runTests;
}

console.log("Booking flow test script loaded. Run testBookingFlow() to test.");
