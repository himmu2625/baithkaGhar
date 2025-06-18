import { connectMongo } from "../lib/db/mongodb.js";
import Property from "../models/Property.js";
import City from "../models/city.js";

async function checkPropertyCounts() {
  try {
    console.log("Connecting to database...");
    await connectMongo();

    console.log("\n=== PROPERTY COUNT ANALYSIS ===\n");

    // Get all cities
    const cities = await City.find({}).sort({ name: 1 });
    console.log(`Found ${cities.length} cities in database:\n`);

    // For each city, count actual properties
    const results = [];

    for (const city of cities) {
      const cityName = city.name;

      // Count all properties for this city
      const totalPropertiesCount = await Property.countDocuments({
        "address.city": { $regex: new RegExp(cityName, "i") },
      });

      // Count active/published properties
      const activePropertiesCount = await Property.countDocuments({
        "address.city": { $regex: new RegExp(cityName, "i") },
        isPublished: true,
        verificationStatus: "approved",
        status: "available",
      });

      // Count pending properties
      const pendingPropertiesCount = await Property.countDocuments({
        "address.city": { $regex: new RegExp(cityName, "i") },
        verificationStatus: "pending",
      });

      results.push({
        cityName: cityName,
        storedCount: city.properties || 0,
        totalActualCount: totalPropertiesCount,
        activeCount: activePropertiesCount,
        pendingCount: pendingPropertiesCount,
        mismatch: (city.properties || 0) !== activePropertiesCount,
      });

      console.log(`${cityName}:`);
      console.log(`  Stored count in city: ${city.properties || 0}`);
      console.log(`  Total properties: ${totalPropertiesCount}`);
      console.log(`  Active properties: ${activePropertiesCount}`);
      console.log(`  Pending properties: ${pendingPropertiesCount}`);
      console.log(
        `  Status: ${
          (city.properties || 0) === activePropertiesCount
            ? "✅ MATCH"
            : "❌ MISMATCH"
        }`
      );
      console.log("");
    }

    // Check for properties in cities not in our cities list
    console.log("\n=== CHECKING FOR ORPHANED PROPERTIES ===\n");

    // Get all unique city names from properties
    const propertyCities = await Property.distinct("address.city");
    const cityNames = cities.map((c) => c.name.toLowerCase());

    const orphanedCities = propertyCities.filter(
      (propCity) => propCity && !cityNames.includes(propCity.toLowerCase())
    );

    if (orphanedCities.length > 0) {
      console.log("Properties found in cities not in our cities collection:");
      for (const orphanCity of orphanedCities) {
        const count = await Property.countDocuments({
          "address.city": { $regex: new RegExp(orphanCity, "i") },
          isPublished: true,
          verificationStatus: "approved",
          status: "available",
        });
        console.log(`  ${orphanCity}: ${count} active properties`);
      }
    } else {
      console.log("✅ No orphaned properties found");
    }

    // Summary
    console.log("\n=== SUMMARY ===\n");
    const mismatches = results.filter((r) => r.mismatch);
    console.log(
      `Cities with count mismatches: ${mismatches.length}/${results.length}`
    );

    if (mismatches.length > 0) {
      console.log("\nCities needing count updates:");
      mismatches.forEach((m) => {
        console.log(
          `  ${m.cityName}: stored=${m.storedCount}, actual=${m.activeCount}`
        );
      });
    }

    console.log("\n=== TOTAL PROPERTIES IN DATABASE ===\n");
    const totalProperties = await Property.countDocuments({});
    const activeProperties = await Property.countDocuments({
      isPublished: true,
      verificationStatus: "approved",
      status: "available",
    });
    const pendingProperties = await Property.countDocuments({
      verificationStatus: "pending",
    });

    console.log(`Total properties: ${totalProperties}`);
    console.log(`Active properties: ${activeProperties}`);
    console.log(`Pending properties: ${pendingProperties}`);

    return results;
  } catch (error) {
    console.error("Error checking property counts:", error);
    throw error;
  }
}

checkPropertyCounts()
  .then(() => {
    console.log("\n✅ Property count check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
