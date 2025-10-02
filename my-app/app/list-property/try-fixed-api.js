// Simple helper function to submit property data to the fixed API
export async function submitToFixedApi(
  formData,
  amenities,
  selectedCategories,
  categoryPrices,
  categorizedImages,
  images,
  propertyType,
  currentCategoryOptions,
  selectedPlans = [],
  selectedOccupancyTypes = []
) {
  console.log("Using fixed API submission");
  console.log("Property type selected:", propertyType); // Debug log for property type

  // Calculate base price - handle edge cases carefully
  let basePrice = 0;
  if (selectedCategories.length > 0 && categoryPrices.length > 0) {
    // Find first category with a valid price
    const firstValidPrice = categoryPrices.find(
      (cp) =>
        selectedCategories.some((sc) => sc.name === cp.categoryName) &&
        cp.price &&
        cp.price.trim() !== "" &&
        !isNaN(parseFloat(cp.price))
    );

    if (firstValidPrice) {
      basePrice = parseFloat(firstValidPrice.price);
    } else {
      // Fallback to 0 and log warning
      console.warn("No valid category prices found, using 0 as base price");
    }
  } else if (
    formData.price &&
    formData.price.trim() !== "" &&
    !isNaN(parseFloat(formData.price))
  ) {
    basePrice = parseFloat(formData.price);
  }

  // Ensure basePrice is a valid number
  if (isNaN(basePrice) || basePrice < 0) {
    basePrice = 0;
  }

  // Ensure we have a valid property type, using the one explicitly selected by the user if available
  const selectedPropertyType = propertyType || formData.propertyType;

  // Validate that property type is one of the allowed values
  if (
    !selectedPropertyType ||
    !["apartment", "house", "hotel", "villa", "resort"].includes(
      selectedPropertyType
    )
  ) {
    console.warn(
      `Invalid property type: ${selectedPropertyType}, defaulting to 'apartment'`
    );
  }

  // Validate and sanitize stayTypes - ensure they're valid enum values
  const validStayTypes = [
    "corporate-stay",
    "family-stay",
    "couple-stay",
    "banquet-events",
  ];
  const sanitizedStayTypes = (formData.stayTypes || []).filter((stayType) =>
    validStayTypes.includes(stayType)
  );

  // If no valid stay types, default to at least one
  if (sanitizedStayTypes.length === 0) {
    sanitizedStayTypes.push("family-stay"); // Default stay type
    console.warn("No valid stay types selected, defaulting to 'family-stay'");
  }

  const dataToSubmit = {
    propertyType: selectedPropertyType || "apartment", // Only use apartment as last resort
    name: formData.name,
    title: formData.name,
    description: formData.description,
    location: `${formData.city}, ${formData.state}, ${
      formData.country || "India"
    }`,
    address: {
      street: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country || "India",
    },
    price: {
      base: basePrice,
    },
    contactNo: formData.contactNo,
    email: formData.email,
    hotelEmail: formData.hotelEmail || "", // Optional hotel email
    generalAmenities: {
      wifi: amenities.wifi || false,
      tv: amenities.tv || false,
      kitchen: amenities.kitchen || false,
      parking: amenities.parking || false,
      ac: amenities.ac || false,
      pool: amenities.pool || false,
      geyser: amenities.geyser || false,
      shower: amenities.shower || false,
      bathTub: amenities.bathTub || false,
      reception24x7: amenities.reception24x7 || false,
      roomService: amenities.roomService || false,
      restaurant: amenities.restaurant || false,
      bar: amenities.bar || false,
      pub: amenities.pub || false,
      fridge: amenities.fridge || false,
    },
    amenities: Object.keys(amenities).filter((key) => amenities[key]),
    otherAmenities: formData.otherAmenities || "",
    categorizedImages: categorizedImages.filter((ci) => ci.files.length > 0),
    legacyGeneralImages: images.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    })),
    propertyUnits:
      selectedCategories.length > 0
        ? selectedCategories.map((sc) => {
            // Build plan-based pricing array if plans and occupancy types are selected
            const planBasedPricing = [];

            if (selectedPlans.length > 0 && selectedOccupancyTypes.length > 0) {
              selectedPlans.forEach(plan => {
                selectedOccupancyTypes.forEach(occupancy => {
                  const priceEntry = categoryPrices.find(p =>
                    p.categoryName === sc.name &&
                    p.planType === plan &&
                    p.occupancyType === occupancy
                  );

                  if (priceEntry && priceEntry.price) {
                    planBasedPricing.push({
                      planType: plan,
                      occupancyType: occupancy,
                      price: parseFloat(priceEntry.price) || 0
                    });
                  }
                });
              });
            }

            // Legacy single price (for backward compatibility)
            const legacyPrice = categoryPrices.find((p) => p.categoryName === sc.name)?.price || "0";

            return {
              unitTypeName:
                currentCategoryOptions.find((opt) => opt.value === sc.name)
                  ?.label || sc.name,
              unitTypeCode: sc.name,
              count: parseInt(sc.count, 10),
              pricing: {
                price: legacyPrice,
                pricePerWeek: "0", // Required field
                pricePerMonth: "0", // Required field
              },
              planBasedPricing: planBasedPricing.length > 0 ? planBasedPricing : undefined,
              roomNumbers:
                sc.roomNumbers && sc.roomNumbers.length > 0
                  ? sc.roomNumbers
                      .filter((rn) => rn && rn.trim() !== "")
                      .map((roomNumber) => ({
                        number: roomNumber.trim(),
                        status: "available",
                      }))
                  : [],
            };
          })
        : [],
    // Convert numeric values to proper types
    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : 1,
    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms, 10) : 1,
    beds: formData.beds ? parseInt(formData.beds, 10) : 1,
    maxGuests: formData.maxGuests ? parseInt(formData.maxGuests, 10) : 2,
    pricing: {
      perNight: selectedCategories.length === 0 ? formData.price || "0" : "0",
      perWeek: "0", // Required field
      perMonth: "0", // Required field
    },
    totalHotelRooms: formData.totalHotelRooms || "0",
    status: formData.status || "available",
    policyDetails: formData.policyDetails || "Standard policies apply",
    minStay: formData.minStay || "1",
    maxStay: formData.maxStay || "30",
    propertySize: formData.propertySize || "Not specified",
    availability: formData.availability || "available",
    isPublished: false,
    isAvailable: true,
    rating: 0,
    reviewCount: 0,
    verificationStatus: "pending",
    city: formData.city,
    stayTypes: sanitizedStayTypes, // Use sanitized stay types
    googleMapLink: formData.googleMapLink || "",
    locationCoords:
      formData.lat && formData.lng
        ? {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
          }
        : undefined,
  };

  console.log(
    "Submitting to fixed API endpoint with property type:",
    dataToSubmit.propertyType
  );
  console.log("Stay types being submitted:", dataToSubmit.stayTypes);

  // Use the fixed API
  const response = await fetch("/api/properties-fixed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToSubmit),
  });

  // Check response
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { message: errorText || `Error ${response.status}` };
    }
    throw new Error(errorData.message || `API error (${response.status})`);
  }

  // Parse and return result
  const result = await response.json();
  console.log("Fixed API response:", result);
  return result;
}
