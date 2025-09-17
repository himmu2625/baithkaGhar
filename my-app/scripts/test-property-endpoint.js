// A simple script to test the property endpoint directly
// You can run this with: node test-property-endpoint.js <property_id>

const propertyId = process.argv[2] || "682232724bfdb3cbdcf0fb7e"; // Use command line arg or default
const baseUrl = "http://localhost:3000";

console.log(`Testing property endpoint for ID: ${propertyId}`);

async function testPropertyEndpoint() {
  try {
    console.log(`Fetching from: ${baseUrl}/api/properties/${propertyId}`);

    const response = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log(`Response status: ${response.status}`);

    // Get the response as text
    const responseText = await response.text();
    console.log("Response text length:", responseText.length);

    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText);
      console.log("Response parsed as JSON:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to parse response as JSON:", e.message);
      console.log("Raw response:", responseText.substring(0, 1000));
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testPropertyEndpoint();

// Test script for property update endpoint

// Self-executing function to run tests
(async () => {
  console.log("Starting property test script...");

  const fetchProperties = async () => {
    try {
      console.log("Fetching properties for a city...");
      const cityName = "mumbai"; // Change to a city in your database
      const response = await fetch(
        `http://localhost:3000/api/properties/by-city?city=${encodeURIComponent(
          cityName
        )}&timestamp=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load properties");
      }

      console.log(`Found ${data.properties.length} properties for ${cityName}`);

      // Show property status
      if (data.properties && data.properties.length > 0) {
        console.log(
          "Properties with status:",
          data.properties.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status || "Unknown",
          }))
        );

        // Return the first property for testing updates
        return data.properties[0];
      } else {
        console.log("No properties found for testing");
        return null;
      }
    } catch (error) {
      console.error("Error in test:", error);
      return null;
    }
  };

  const testPropertyUpdate = async (propertyId, status) => {
    if (!propertyId) {
      console.log("No property ID provided for testing");
      return;
    }

    try {
      console.log(
        `Testing update for property ${propertyId} with status ${status}`
      );

      const response = await fetch(
        `http://localhost:3000/api/properties/${propertyId}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status,
            title: "Test Update " + new Date().toISOString(),
            _method: "patch",
          }),
        }
      );

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Response is not JSON:", responseText);
        responseData = { rawText: responseText };
      }

      if (!response.ok) {
        console.error("Error response:", response.status, responseData);
        throw new Error(`Failed to update property: ${response.status}`);
      }

      console.log("Update response:", responseData);
      return responseData;
    } catch (error) {
      console.error("Error in test update:", error);
      return null;
    }
  };

  // Run the test
  const runTest = async () => {
    // First get a property to test with
    const testProperty = await fetchProperties();

    if (testProperty) {
      // Test updating the property with a status value
      await testPropertyUpdate(testProperty.id, "active");

      // Fetch properties again to see if status is updated
      setTimeout(async () => {
        console.log("Checking updated properties:");
        await fetchProperties();
      }, 1000);
    }
  };

  // Run the test automatically
  await runTest();
})();
 