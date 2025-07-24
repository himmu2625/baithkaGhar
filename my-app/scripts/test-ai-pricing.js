const {
  generatePriceSuggestions,
} = require("../lib/services/ai-pricing-service");

// Mock data for testing
const mockProperty = {
  _id: "test-property-123",
  price: 2000,
  location: {
    city: "Mumbai",
    state: "Maharashtra",
  },
  type: "Hotel",
  amenities: ["WiFi", "Pool", "Gym", "Spa"],
  dynamicPricing: {
    enabled: true,
  },
};

const mockHistoricalBookings = [
  {
    totalPrice: 6000,
    checkIn: new Date("2024-01-01"),
    checkOut: new Date("2024-01-04"),
    guests: 2,
    createdAt: new Date("2023-12-20"),
  },
  {
    totalPrice: 8000,
    checkIn: new Date("2024-02-10"),
    checkOut: new Date("2024-02-14"),
    guests: 4,
    createdAt: new Date("2024-02-01"),
  },
  {
    totalPrice: 4000,
    checkIn: new Date("2024-03-15"),
    checkOut: new Date("2024-03-17"),
    guests: 2,
    createdAt: new Date("2024-03-10"),
  },
];

const mockSimilarProperties = [
  {
    _id: "similar-1",
    price: 1800,
    location: { city: "Mumbai", state: "Maharashtra" },
    type: "Hotel",
    amenities: ["WiFi", "Pool"],
    dynamicPricing: { enabled: true },
  },
  {
    _id: "similar-2",
    price: 2200,
    location: { city: "Mumbai", state: "Maharashtra" },
    type: "Hotel",
    amenities: ["WiFi", "Gym"],
    dynamicPricing: { enabled: false },
  },
];

const mockMarketBookings = [
  {
    totalPrice: 5400,
    checkIn: new Date("2024-04-01"),
    checkOut: new Date("2024-04-04"),
    guests: 2,
    createdAt: new Date("2024-03-25"),
    propertyId: "similar-1",
  },
  {
    totalPrice: 6600,
    checkIn: new Date("2024-04-05"),
    checkOut: new Date("2024-04-08"),
    guests: 3,
    createdAt: new Date("2024-03-28"),
    propertyId: "similar-2",
  },
];

const mockInput = {
  property: mockProperty,
  historicalBookings: mockHistoricalBookings,
  similarProperties: mockSimilarProperties,
  marketBookings: mockMarketBookings,
  targetDates: {
    startDate: "2024-05-01",
    endDate: "2024-05-07",
  },
  guests: 2,
};

async function testAiPricingSuggestions() {
  console.log("🧠 Testing AI Pricing Suggestions...\n");

  try {
    const result = await generatePriceSuggestions(mockInput);

    console.log("✅ AI Pricing Suggestions Generated Successfully!\n");

    // Display suggestions
    console.log("💡 Price Suggestions:");
    result.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.type.toUpperCase()} Strategy:`);
      console.log(`   Price: ₹${suggestion.suggestedPrice}`);
      console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      console.log(
        `   Revenue Impact: ${suggestion.revenueImpact >= 0 ? "+" : ""}${
          suggestion.revenueImpact
        }%`
      );
      console.log(
        `   Expected Occupancy: ${Math.round(
          suggestion.expectedOccupancy * 100
        )}%`
      );
      console.log(`   Market Position: ${suggestion.marketPosition}`);
      console.log(`   Reasoning: ${suggestion.reasoning.join(", ")}`);
      console.log("");
    });

    // Display market analysis
    console.log("📊 Market Analysis:");
    console.log(
      `   Average Market Price: ₹${result.marketAnalysis.averageMarketPrice}`
    );
    console.log(
      `   Price Range: ₹${result.marketAnalysis.priceRange.min} - ₹${result.marketAnalysis.priceRange.max}`
    );
    console.log(`   Competitors: ${result.marketAnalysis.competitorCount}`);
    console.log(`   Demand Level: ${result.marketAnalysis.demandLevel}`);
    console.log("");

    // Display historical insights
    console.log("📈 Historical Insights:");
    console.log(
      `   Average Historical Price: ₹${result.historicalInsights.averagePrice}`
    );
    console.log(
      `   Occupancy Rate: ${Math.round(
        result.historicalInsights.occupancyRate * 100
      )}%`
    );
    console.log(
      `   Seasonal Trends: ${result.historicalInsights.seasonalTrends.length} months of data`
    );
    console.log("");

    // Display recommendations
    console.log("🎯 Recommendations:");
    if (result.recommendations.shortTerm.length > 0) {
      console.log("   Short-term:");
      result.recommendations.shortTerm.forEach((rec) =>
        console.log(`   • ${rec}`)
      );
    }
    if (result.recommendations.longTerm.length > 0) {
      console.log("   Long-term:");
      result.recommendations.longTerm.forEach((rec) =>
        console.log(`   • ${rec}`)
      );
    }

    console.log("\n🎉 AI Pricing Test Completed Successfully!");
  } catch (error) {
    console.error("❌ AI Pricing Test Failed:", error);
  }
}

// Run the test
testAiPricingSuggestions();
