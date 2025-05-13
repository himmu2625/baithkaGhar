// Simple helper function to submit property data to the fixed API
export async function submitToFixedApi(
  formData,
  amenities,
  selectedCategories,
  categoryPrices,
  categorizedImages,
  images,
  propertyType,
  currentCategoryOptions
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
        ? selectedCategories.map((sc) => ({
            unitTypeName:
              currentCategoryOptions.find((opt) => opt.value === sc.name)
                ?.label || sc.name,
            unitTypeCode: sc.name,
            count: parseInt(sc.count, 10),
            pricing: {
              price:
                categoryPrices.find((p) => p.categoryName === sc.name)?.price ||
                "0",
              pricePerWeek:
                categoryPrices.find((p) => p.categoryName === sc.name)
                  ?.pricePerWeek || "0",
              pricePerMonth:
                categoryPrices.find((p) => p.categoryName === sc.name)
                  ?.pricePerMonth || "0",
            },
          }))
        : undefined,
    bedrooms: formData.bedrooms || "1",
    bathrooms: formData.bathrooms || "1",
    pricing:
      selectedCategories.length === 0
        ? {
            perNight: formData.price || "0",
            perWeek: formData.pricePerWeek || "0",
            perMonth: formData.pricePerMonth || "0",
          }
        : undefined,
    totalHotelRooms: formData.totalHotelRooms || "0",
    status: formData.status,
    policyDetails: formData.policyDetails || "",
    minStay: formData.minStay || "1",
    maxStay: formData.maxStay || "30",
    propertySize: formData.propertySize || "",
    availability: formData.availability || "available",
    maxGuests: formData.maxGuests || 2,
    beds: formData.beds || 1,
    isPublished: false,
    isAvailable: true,
    rating: 0,
    reviewCount: 0,
    verificationStatus: "pending",
    city: formData.city,
  };

  console.log(
    "Submitting to fixed API endpoint with property type:",
    dataToSubmit.propertyType
  );

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
