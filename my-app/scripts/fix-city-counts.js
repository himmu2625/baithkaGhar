console.log("🔧 Starting city count fix...\n");

// Function to call the update city counts API
async function fixCityCounts() {
  try {
    console.log("📡 Calling update city counts API...");

    // Make a request to the update-city-counts endpoint
    const response = await fetch(
      "http://localhost:3000/api/update-city-counts",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ API request failed with status ${response.status}:`,
        errorText
      );
      return;
    }

    const result = await response.json();

    console.log("✅ City counts updated successfully!\n");
    console.log("📊 Results:");
    console.log(`- Updated ${result.results?.length || 0} cities`);

    if (result.results) {
      console.log("\n📋 Detailed results:");
      result.results.forEach((city) => {
        const status =
          city.oldCount !== city.newCount ? "🔄 UPDATED" : "✅ NO CHANGE";
        console.log(
          `  ${city.name}: ${city.oldCount} → ${city.newCount} ${status}`
        );
      });
    }

    console.log("\n🎉 City count fix completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing city counts:", error.message);
    console.log(
      "\n💡 Make sure your development server is running on http://localhost:3000"
    );
    console.log("   Run: npm run dev");
  }
}

// Run the fix
fixCityCounts();
