# Property Edit Feature Documentation

## Overview
Complete property edit functionality has been implemented, allowing you to update existing properties with the same comprehensive form structure as the list property page.

## What Has Been Implemented

### 1. Edit Property Page
**Location:** `my-app/app/admin/properties/[id]/edit/page.tsx`

A comprehensive edit form with 4 tabs matching the list property form:

#### Tab 1: Basic Information
- Property Type (apartment, house, hotel, villa, resort)
- Property Name
- Description
- Address Fields (street, city, state, zip code, country)
- Contact Information (phone, email, hotel email)
- Google Maps Link
- Coordinates (latitude, longitude)

#### Tab 2: Details & Amenities
- **Stay Types** (multi-select):
  - Corporate Stay
  - Family Stay
  - Couple Stay
  - Banquet/Events
  - Travel Agent
- **Room Categories** (for hotels/resorts):
  - All categories from the room categories database
  - Room counts per category
  - Room numbers
  - Max capacity per room
  - Extra person charges
- **Amenities** (checkboxes):
  - WiFi, TV, Kitchen, Parking, AC, Pool
  - Geyser, Shower, Bath Tub
  - 24x7 Reception, Room Service
  - Restaurant, Bar, Pub, Fridge
- Other amenities (text field)
- Property details (bedrooms, bathrooms, beds, max guests)

#### Tab 3: Photos & Pricing
- **Categorized Images**:
  - Exterior photos
  - Interior photos
  - Bedroom photos
  - Bathroom photos
  - Amenities photos
- **Pricing Options**:
  - Plan-based pricing (EP, CP, MAP, AP)
  - Occupancy-based pricing (Single, Double, Triple, Quad)
  - Category-specific pricing for hotels/resorts
  - General pricing for other property types

#### Tab 4: Enhanced Information
- About Property (detailed description)
- House Rules:
  - Check-in time
  - Check-out time
  - Quiet hours
  - Smoking allowed
  - Pets allowed
  - Parties/Events allowed
- Property Highlights
- Nearby Locations
- Additional Rules

### 2. Enhanced Update API
**Location:** `my-app/app/api/properties/[id]/update/route.ts`

The API has been enhanced to handle all property fields:

#### Supported Fields
- **Basic Info**: title, name, description, propertyType, address, location coordinates
- **Contact**: contactNo, email, hotelEmail
- **Details**: bedrooms, bathrooms, beds, maxGuests, propertySize
- **Amenities**: generalAmenities object, otherAmenities
- **Status**: status, availability, minStay, maxStay
- **Room Categories**: propertyUnits array with:
  - Unit type name and code
  - Room count
  - Room numbers
  - Max capacity per room
  - Extra person charges
  - Plan-based pricing (EP/CP/MAP/AP × Single/Double/Triple/Quad)
- **Images**: categorizedImages, legacyGeneralImages
- **Stay Types**: stayTypes array
- **Pricing**: price object, pricing object (perNight, perWeek, perMonth)
- **Enhanced Info**:
  - mealPricing (breakfast, lunch/dinner, all meals)
  - aboutProperty
  - propertyHighlights array
  - nearbyLocations array
  - houseRules object
  - roomRestrictions
  - dynamicPricing (if provided)

#### Security & Permissions
- Authentication required
- User authorization check (property owner or admin)
- Admin users can update verification status
- Auto-approval when admin updates stay types

### 3. Integration with Admin Dashboard
**Location:** `my-app/app/admin/properties/page.tsx`

The "Edit Property" button in the admin properties list now redirects to the dedicated edit page instead of opening a modal.

## Database Schema Mapping

All fields in the edit form map directly to the Property model schema:

```typescript
// Core Fields
title, name, slug, description, location
propertyType, status, availability

// Address
address: {
  street, city, state, zipCode, country,
  coordinates: { lat, lng }
}

// Pricing
price: { base, cleaning, service, tax }
pricing: { perNight, perWeek, perMonth }

// Property Units (Room Categories)
propertyUnits: [{
  unitTypeName, unitTypeCode, count,
  maxCapacityPerRoom, freeExtraPersonLimit, extraPersonCharge,
  pricing: { price, pricePerWeek, pricePerMonth },
  planBasedPricing: [{ planType, occupancyType, price }],
  roomNumbers: [{ number, status }]
}]

// Amenities
generalAmenities: {
  wifi, tv, kitchen, parking, ac, pool,
  geyser, shower, bathTub, reception24x7,
  roomService, restaurant, bar, pub, fridge
}
otherAmenities

// Images
categorizedImages: [{ category, files: [{ url, public_id }] }]
legacyGeneralImages: [{ url, public_id }]

// Stay Types
stayTypes: ['corporate-stay', 'family-stay', 'couple-stay', 'banquet-events', 'travel-agent']

// Enhanced Info
aboutProperty
propertyHighlights: [string]
nearbyLocations: [{ name, type, distance }]
houseRules: {
  checkInTime, checkOutTime, quietHours,
  smokingAllowed, petsAllowed, partiesAllowed,
  additionalRules: [string]
}

// Meal Pricing
mealPricing: {
  breakfast: { enabled, pricePerPerson, description }
  lunchDinner: { enabled, pricePerPerson, description }
  allMeals: { enabled, pricePerPerson, description }
}

// Room Restrictions
roomRestrictions: {
  maxGuestsPerRoom, extraPersonCharge, allowExtraGuests
}

// Dynamic Pricing
dynamicPricing: { ... } // Full dynamic pricing configuration
```

## How to Use

### Editing a Property

1. **Navigate to Admin Properties**
   - Go to `/admin/properties`
   - You'll see a list of all properties

2. **Select Property to Edit**
   - Click the three-dot menu (⋮) for any property
   - Click "Edit Property"
   - You'll be redirected to `/admin/properties/[id]/edit`

3. **Edit Property Details**
   - **Basic Info Tab**: Update property name, description, address, contact info
   - **Details & Amenities Tab**:
     - Select/deselect stay types
     - Add/remove room categories
     - Update room counts and pricing
     - Toggle amenities
   - **Photos & Pricing Tab**:
     - Upload new images by category
     - Remove existing images
     - Update pricing for each room category and plan type
   - **Enhanced Info Tab**:
     - Add detailed "About" section
     - Set house rules and timings
     - Configure meal options

4. **Save Changes**
   - Click "Update Property" button at the bottom
   - You'll be redirected back to the properties list
   - Changes will be reflected immediately

### Image Management

**Uploading Images:**
- Click "Upload [category] images" button for each category
- Select multiple images at once
- Images are uploaded to Cloudinary
- Images are organized by category (exterior, interior, bedroom, bathroom, amenities)

**Removing Images:**
- Hover over any image
- Click the X button that appears
- Image is removed from Cloudinary and the database

### Pricing Configuration

**For Hotels/Resorts (with room categories):**
- Set pricing for each combination of:
  - Room Category (e.g., Deluxe, Suite)
  - Plan Type (EP, CP, MAP, AP)
  - Occupancy (Single, Double, Triple, Quad)

**For Other Property Types:**
- Set a single base price per night
- Optionally set weekly and monthly rates

### Stay Types

Select all applicable stay types:
- **Corporate Stay**: Business travelers, corporate bookings
- **Family Stay**: Family vacations and gatherings
- **Couple Stay**: Romantic getaways, honeymoons
- **Banquet/Events**: Weddings, conferences, events
- **Travel Agent**: Properties available through travel agents

## Validation

The form validates:
- Required fields (name, type, address, city, state, zip, contact, email, description)
- At least one stay type must be selected
- Email format validation
- Pricing must be positive numbers
- Room counts must be greater than 0
- At least one exterior and one interior photo (recommended)

## API Endpoints

### Get Property Details
```
GET /api/properties/[id]
```
Returns full property data for editing

### Update Property
```
POST /api/properties/[id]/update
```
Updates property with new data

**Request Body:** JSON object with property fields to update

**Response:**
```json
{
  "success": true,
  "message": "Property updated successfully",
  "property": {
    "id": "...",
    "title": "...",
    "propertyType": "...",
    "status": "..."
  }
}
```

## Technical Details

### State Management
- React state hooks manage form data
- Separate state for amenities, categories, images, pricing
- Form validation on submit

### Image Upload
- Direct upload to Cloudinary
- Upload preset: `baithaka_hotels`
- Organized by folder: `property_images/{category}`
- Returns URL and public_id for database storage

### Authentication
- Uses NextAuth session
- Redirects to login if unauthenticated
- Checks user permissions on API level

### Loading States
- Full page loader while fetching property data
- Button loading state during submission
- Upload progress indicators for images

## Future Enhancements

Potential improvements:
1. ✅ Drag-and-drop image reordering
2. ✅ Bulk image upload
3. ✅ Image preview before upload
4. ✅ Pricing templates/presets
5. ✅ Duplicate property feature
6. ✅ Revision history
7. ✅ Auto-save drafts
8. ✅ Batch property updates

## Troubleshooting

### Property Won't Load
- Check if property ID is valid
- Verify user has permission to edit
- Check browser console for API errors

### Images Not Uploading
- Verify Cloudinary credentials
- Check file size (max 10MB recommended)
- Ensure file format is supported (jpg, png, webp)

### Update Fails
- Ensure all required fields are filled
- Check validation errors
- Verify at least one stay type is selected
- Check network connection

### Pricing Not Saving
- Ensure prices are positive numbers
- For hotels/resorts, fill at least one pricing combination
- Check that room categories are selected

## Related Files

```
my-app/
├── app/
│   ├── admin/
│   │   └── properties/
│   │       ├── page.tsx (property list with edit button)
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx (edit form)
│   ├── api/
│   │   └── properties/
│   │       └── [id]/
│   │           ├── route.ts (GET property)
│   │           └── update/
│   │               └── route.ts (POST update)
│   └── list-property/
│       └── page.tsx (original create form)
├── models/
│   └── Property.ts (database schema)
├── lib/
│   └── constants/
│       ├── room-categories.ts
│       └── stay-types.ts
└── components/
    └── ui/
        ├── modern-multi-select.tsx
        └── [various form components]
```

## Summary

The edit property feature provides a complete, user-friendly interface for updating all aspects of a property listing. It maintains consistency with the list property form while providing a streamlined editing experience. All property fields are fully supported, from basic information to complex pricing matrices and enhanced features.
