import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("POST /api/properties-simple - Starting");

    // Get the data from the request
    const data = await request.json();
    console.log("Received property data:", JSON.stringify(data, null, 2));

    // Extract and fix the price data
    let basePrice = 0;
    if (data.price && data.price.base !== undefined) {
      // Try to ensure it's a number
      basePrice =
        typeof data.price.base === "number"
          ? data.price.base
          : parseFloat(data.price.base) || 0;
    } else if (data.pricing && data.pricing.perNight) {
      // Use pricing.perNight as fallback
      basePrice =
        typeof data.pricing.perNight === "number"
          ? data.pricing.perNight
          : parseFloat(data.pricing.perNight) || 0;
    }

    // Fix the data structure
    const fixedData = {
      ...data,
      price: {
        base: basePrice,
      },
      // Ensure amenities is an array
      amenities: Array.isArray(data.amenities)
        ? data.amenities
        : data.generalAmenities
        ? Object.keys(data.generalAmenities).filter(
            (key) => data.generalAmenities[key]
          )
        : [],
    };

    console.log("Property data processed successfully");

    // Return the fixed data structure
    return NextResponse.json(
      {
        message: "Property data received successfully",
        receivedData: data,
        fixedData: fixedData,
        price: {
          original: data.price,
          fixed: fixedData.price,
          basePrice,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing property data:", error);
    return NextResponse.json(
      {
        message: "Error processing property data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
