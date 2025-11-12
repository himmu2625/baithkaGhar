# Property Database Schema & Form Mapping

## Complete Schema Overview

This document maps all fields between the Property database model, the list property form, and the edit property form.

## Core Property Fields

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `_id` | ObjectId | Auto-generated | N/A | Yes | MongoDB ID |
| `title` | String | Basic Info | Tab 1 | Yes | Property name |
| `name` | String | Basic Info | Tab 1 | Yes | Display name |
| `slug` | String | Auto-generated | N/A | No | URL-friendly title |
| `description` | String | Basic Info | Tab 1 | Yes | Property description |
| `propertyType` | Enum | Basic Info | Tab 1 | Yes | apartment, house, hotel, villa, resort |
| `status` | Enum | Details | Tab 2 | Yes | available, unavailable, maintenance, deleted |
| `isPublished` | Boolean | Auto-set | N/A | Yes | Publication status |
| `isAvailable` | Boolean | Auto-set | N/A | Yes | Availability flag |
| `createdAt` | Date | Auto-generated | N/A | Yes | Creation timestamp |
| `updatedAt` | Date | Auto-generated | N/A | Yes | Update timestamp |

## Address & Location

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `address.street` | String | Basic Info | Tab 1 | Yes | Street address |
| `address.city` | String | Basic Info | Tab 1 | Yes | City name |
| `address.state` | String | Basic Info | Tab 1 | Yes | State/Province |
| `address.zipCode` | String | Basic Info | Tab 1 | Yes | Postal code |
| `address.country` | String | Basic Info | Tab 1 | Yes | Country (default: India) |
| `address.coordinates.lat` | Number | Basic Info | Tab 1 | No | Latitude |
| `address.coordinates.lng` | Number | Basic Info | Tab 1 | No | Longitude |
| `location` | String | Basic Info | Tab 1 | Yes | Location string |
| `locationCoords.lat` | Number | Basic Info | Tab 1 | No | Alternative lat |
| `locationCoords.lng` | Number | Basic Info | Tab 1 | No | Alternative lng |
| `googleMapLink` | String | Basic Info | Tab 1 | No | Google Maps URL |

## Contact Information

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `contactNo` | String | Basic Info | Tab 1 | Yes | Phone number |
| `email` | String | Basic Info | Tab 1 | Yes | Primary email |
| `hotelEmail` | String | Basic Info | Tab 1 | No | Property email |

## User & Ownership

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `userId` | ObjectId | Auto-set | N/A | Yes | Property owner ID |
| `hostId` | ObjectId | Auto-set | N/A | Yes | Host ID (same as userId) |
| `verificationStatus` | Enum | Admin only | N/A | Yes | pending, approved, rejected |
| `verificationNotes` | String | Admin only | N/A | No | Admin notes |
| `verifiedAt` | Date | Auto-set | N/A | No | Verification timestamp |
| `verifiedBy` | ObjectId | Auto-set | N/A | No | Admin who verified |

## Property Details

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `bedrooms` | Number | Details | Tab 2 | Conditional | Required if no propertyUnits |
| `bathrooms` | Number | Details | Tab 2 | Conditional | Required if no propertyUnits |
| `beds` | Number | Details | Tab 2 | Yes | Number of beds |
| `maxGuests` | Number | Details | Tab 2 | Yes | Maximum guests |
| `propertySize` | String | Details | Tab 2 | Yes | Size in sq ft |
| `totalHotelRooms` | String | Details | Tab 2 | Yes | Total rooms |
| `availability` | String | Details | Tab 2 | Yes | Availability info |
| `minStay` | String | Details | Tab 2 | Yes | Minimum stay duration |
| `maxStay` | String | Details | Tab 2 | Yes | Maximum stay duration |
| `policyDetails` | String | Details | Tab 2 | Yes | Cancellation policy |

## Pricing

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `price.base` | Number | Pricing | Tab 3 | Yes | Base price per night |
| `price.cleaning` | Number | Pricing | Tab 3 | No | Cleaning fee |
| `price.service` | Number | Pricing | Tab 3 | No | Service fee |
| `price.tax` | Number | Pricing | Tab 3 | No | Tax amount |
| `pricing.perNight` | String | Pricing | Tab 3 | Yes | Price per night |
| `pricing.perWeek` | String | Pricing | Tab 3 | Yes | Price per week |
| `pricing.perMonth` | String | Pricing | Tab 3 | Yes | Price per month |

## Property Units (Room Categories)

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `propertyUnits[]` | Array | Details | Tab 2 | For hotels/resorts | Room categories |
| `propertyUnits[].unitTypeName` | String | Details | Tab 2 | Yes | Category name |
| `propertyUnits[].unitTypeCode` | String | Auto-generated | Tab 2 | Yes | Category code |
| `propertyUnits[].count` | Number | Details | Tab 2 | Yes | Number of rooms |
| `propertyUnits[].maxCapacityPerRoom` | Number | Details | Tab 2 | No | Max guests per room |
| `propertyUnits[].freeExtraPersonLimit` | Number | Details | Tab 2 | No | Free extra persons |
| `propertyUnits[].extraPersonCharge` | Number | Details | Tab 2 | No | Charge per extra person |
| `propertyUnits[].pricing.price` | String | Pricing | Tab 3 | Yes | Base price |
| `propertyUnits[].pricing.pricePerWeek` | String | Pricing | Tab 3 | Yes | Weekly price |
| `propertyUnits[].pricing.pricePerMonth` | String | Pricing | Tab 3 | Yes | Monthly price |
| `propertyUnits[].planBasedPricing[]` | Array | Pricing | Tab 3 | For hotels/resorts | Plan-based rates |
| `propertyUnits[].planBasedPricing[].planType` | Enum | Pricing | Tab 3 | Yes | EP, CP, MAP, AP |
| `propertyUnits[].planBasedPricing[].occupancyType` | Enum | Pricing | Tab 3 | Yes | SINGLE, DOUBLE, TRIPLE, QUAD |
| `propertyUnits[].planBasedPricing[].price` | Number | Pricing | Tab 3 | Yes | Price for combination |
| `propertyUnits[].roomNumbers[]` | Array | Details | Tab 2 | No | Room number list |
| `propertyUnits[].roomNumbers[].number` | String | Details | Tab 2 | Yes | Room number |
| `propertyUnits[].roomNumbers[].status` | Enum | Auto-set | N/A | Yes | available, booked, maintenance |

## Amenities

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `generalAmenities.wifi` | Boolean | Amenities | Tab 2 | Yes | WiFi available |
| `generalAmenities.tv` | Boolean | Amenities | Tab 2 | Yes | TV available |
| `generalAmenities.kitchen` | Boolean | Amenities | Tab 2 | Yes | Kitchen available |
| `generalAmenities.parking` | Boolean | Amenities | Tab 2 | Yes | Parking available |
| `generalAmenities.ac` | Boolean | Amenities | Tab 2 | Yes | AC available |
| `generalAmenities.pool` | Boolean | Amenities | Tab 2 | Yes | Pool available |
| `generalAmenities.geyser` | Boolean | Amenities | Tab 2 | Yes | Geyser available |
| `generalAmenities.shower` | Boolean | Amenities | Tab 2 | Yes | Shower available |
| `generalAmenities.bathTub` | Boolean | Amenities | Tab 2 | Yes | Bath tub available |
| `generalAmenities.reception24x7` | Boolean | Amenities | Tab 2 | Yes | 24x7 reception |
| `generalAmenities.roomService` | Boolean | Amenities | Tab 2 | Yes | Room service |
| `generalAmenities.restaurant` | Boolean | Amenities | Tab 2 | Yes | Restaurant available |
| `generalAmenities.bar` | Boolean | Amenities | Tab 2 | Yes | Bar available |
| `generalAmenities.pub` | Boolean | Amenities | Tab 2 | Yes | Pub available |
| `generalAmenities.fridge` | Boolean | Amenities | Tab 2 | Yes | Fridge available |
| `otherAmenities` | String | Amenities | Tab 2 | No | Additional amenities |
| `amenities[]` | Array[String] | Legacy | N/A | No | Legacy amenities array |
| `rules[]` | Array[String] | Legacy | N/A | No | Legacy rules array |

## Stay Types

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `stayTypes[]` | Array[Enum] | Details | Tab 2 | Yes | At least one required |
| | | | | | corporate-stay |
| | | | | | family-stay |
| | | | | | couple-stay |
| | | | | | banquet-events |
| | | | | | travel-agent |

## Images

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `categorizedImages[]` | Array | Photos | Tab 3 | Recommended | Organized by category |
| `categorizedImages[].category` | String | Photos | Tab 3 | Yes | exterior, interior, bedroom, bathroom, amenities |
| `categorizedImages[].files[]` | Array | Photos | Tab 3 | Yes | Image files |
| `categorizedImages[].files[].url` | String | Photos | Tab 3 | Yes | Cloudinary URL |
| `categorizedImages[].files[].public_id` | String | Photos | Tab 3 | Yes | Cloudinary public ID |
| `legacyGeneralImages[]` | Array | Photos | Tab 3 | No | Legacy general images |
| `legacyGeneralImages[].url` | String | Photos | Tab 3 | Yes | Image URL |
| `legacyGeneralImages[].public_id` | String | Photos | Tab 3 | Yes | Cloudinary public ID |
| `images[]` | Array[String] | Legacy | N/A | No | Legacy image URLs |

## Meal Pricing

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `mealPricing.breakfast.enabled` | Boolean | Enhanced | Tab 4 | No | Breakfast available |
| `mealPricing.breakfast.pricePerPerson` | Number | Enhanced | Tab 4 | No | Price per person |
| `mealPricing.breakfast.description` | String | Enhanced | Tab 4 | No | Meal description |
| `mealPricing.lunchDinner.enabled` | Boolean | Enhanced | Tab 4 | No | Lunch/Dinner available |
| `mealPricing.lunchDinner.pricePerPerson` | Number | Enhanced | Tab 4 | No | Price per person |
| `mealPricing.lunchDinner.description` | String | Enhanced | Tab 4 | No | Meal description |
| `mealPricing.allMeals.enabled` | Boolean | Enhanced | Tab 4 | No | All meals available |
| `mealPricing.allMeals.pricePerPerson` | Number | Enhanced | Tab 4 | No | Price per person |
| `mealPricing.allMeals.description` | String | Enhanced | Tab 4 | No | Meal description |

## Enhanced Property Information

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `aboutProperty` | String | Enhanced | Tab 4 | No | Detailed description |
| `propertyHighlights[]` | Array[String] | Enhanced | Tab 4 | No | Property USPs |
| `nearbyLocations[]` | Array | Enhanced | Tab 4 | No | Nearby attractions |
| `nearbyLocations[].name` | String | Enhanced | Tab 4 | Yes | Location name |
| `nearbyLocations[].type` | Enum | Enhanced | Tab 4 | Yes | attraction, transport, restaurant, hospital, shopping, religious, entertainment, other |
| `nearbyLocations[].distance` | String | Enhanced | Tab 4 | Yes | Distance (e.g., "2 km") |

## House Rules

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `houseRules.checkInTime` | String | Enhanced | Tab 4 | No | Check-in time |
| `houseRules.checkOutTime` | String | Enhanced | Tab 4 | No | Check-out time |
| `houseRules.quietHours` | String | Enhanced | Tab 4 | No | Quiet hours |
| `houseRules.smokingAllowed` | Boolean | Enhanced | Tab 4 | No | Smoking policy |
| `houseRules.petsAllowed` | Boolean | Enhanced | Tab 4 | No | Pet policy |
| `houseRules.partiesAllowed` | Boolean | Enhanced | Tab 4 | No | Parties policy |
| `houseRules.additionalRules[]` | Array[String] | Enhanced | Tab 4 | No | Custom rules |

## Room Restrictions

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `roomRestrictions.maxGuestsPerRoom` | Number | Details | Tab 2 | No | Max guests per room |
| `roomRestrictions.extraPersonCharge` | Number | Details | Tab 2 | No | Extra person charge |
| `roomRestrictions.allowExtraGuests` | Boolean | Details | Tab 2 | No | Allow extra guests |

## Dynamic Pricing (Advanced)

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `dynamicPricing.enabled` | Boolean | Admin only | N/A | No | Enable dynamic pricing |
| `dynamicPricing.basePrice` | Number | Admin only | N/A | No | Base price |
| `dynamicPricing.minPrice` | Number | Admin only | N/A | No | Minimum price |
| `dynamicPricing.maxPrice` | Number | Admin only | N/A | No | Maximum price |
| `dynamicPricing.seasonalRates` | Object | Admin only | N/A | No | Seasonal pricing |
| `dynamicPricing.weeklyRates` | Object | Admin only | N/A | No | Day-of-week pricing |
| `dynamicPricing.demandPricing` | Object | Admin only | N/A | No | Demand-based pricing |
| `dynamicPricing.advanceBookingDiscounts` | Object | Admin only | N/A | No | Early booking discounts |
| `dynamicPricing.directPricing` | Object | Admin only | N/A | No | Direct pricing rules |
| `dynamicPricing.availabilityControl` | Object | Admin only | N/A | No | Availability settings |
| `dynamicPricing.dynamicStayRules` | Object | Admin only | N/A | No | Dynamic min/max stay |

## Reviews & Ratings

| Database Field | Type | Form Location | Edit Form Tab | Required | Notes |
|---------------|------|---------------|---------------|----------|-------|
| `rating` | Number | Auto-calculated | N/A | No | Average rating (0-5) |
| `reviewCount` | Number | Auto-calculated | N/A | No | Total reviews |

## Schema Validation Rules

### Required Field Combinations

**For ALL property types:**
- Basic info (name, type, description, address, city, state, zip)
- Contact info (phone, email)
- At least one stay type
- Property details (beds, maxGuests, propertySize, totalHotelRooms)
- Policy details, minStay, maxStay, availability
- At least one pricing option

**For Hotels & Resorts:**
- At least one property unit (room category)
- Room count > 0 for each category
- At least one plan-based pricing entry per category

**For Other Property Types:**
- Bedrooms and bathrooms (if no property units)
- General pricing (if no category pricing)

### Image Recommendations
- At least 1 exterior image
- At least 1 interior image
- Recommended: 5-10 images per category
- Maximum image size: 10MB
- Supported formats: JPG, PNG, WEBP

### Pricing Validation
- All prices must be positive numbers
- Base price is required
- Category-specific pricing overrides general pricing

### Text Field Limits
- Title/Name: 100 characters
- Description: 2000 characters
- About Property: 5000 characters
- Policy Details: 2000 characters
- Other Amenities: 500 characters

## Form Tabs Summary

### Tab 1: Basic Information
Fields: propertyType, name, description, address (all fields), contactNo, email, hotelEmail, googleMapLink, lat, lng

### Tab 2: Details & Amenities
Fields: stayTypes, propertyUnits (categories, counts, capacities), generalAmenities (all), otherAmenities, bedrooms, bathrooms, beds, maxGuests

### Tab 3: Photos & Pricing
Fields: categorizedImages (all categories), legacyGeneralImages, pricing (all combinations), categoryPrices

### Tab 4: Enhanced Information
Fields: aboutProperty, houseRules (all), propertyHighlights, nearbyLocations, mealPricing

## Data Flow

```
User Edit → Form State → Validation → API Request → Database Update → Success Response
     ↓                                       ↓
Property Fetch ← API Response ← Database Query
```

## Important Notes

1. **Auto-generated Fields**: `_id`, `slug`, `createdAt`, `updatedAt`, `verificationStatus`, `isPublished`, `isAvailable` are managed by the system

2. **Admin-only Fields**: `verificationStatus`, `verificationNotes`, `verifiedBy`, `verifiedAt` can only be modified by admin users

3. **Legacy Fields**: Some fields like `images[]`, `amenities[]`, `rules[]` are kept for backward compatibility

4. **Conditional Requirements**: Bedrooms/bathrooms are required ONLY if no propertyUnits are defined

5. **Image Organization**: Use categorized images for better organization and display. Legacy images are supported but not recommended for new uploads.

6. **Pricing Complexity**: Hotels/resorts can have up to 64 pricing combinations per room category (4 plans × 4 occupancy types × N categories)

This comprehensive mapping ensures complete data consistency between the form interface and database schema.
