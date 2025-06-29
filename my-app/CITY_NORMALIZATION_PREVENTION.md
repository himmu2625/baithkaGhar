# City Normalization & Duplicate Prevention System

## Overview

This system ensures consistent city naming and prevents duplicate cities due to case sensitivity and formatting differences.

## Problem Solved

Previously, properties with city names like:

- `"AYODHYA , UTTAR PRADESH"` (uppercase with space before comma)
- `"Ayodhya, UTTAR PRADESH"` (titlecase without space before comma)

Were treated as different cities, causing incorrect property counts.

## Solution Components

### 1. City Utilities (`lib/utils/city-utils.ts`)

#### `normalizeCityName(cityName: string)`

- Extracts city name before comma/state information
- Converts to proper Title Case
- Handles spacing variations
- Example: `"AYODHYA , UTTAR PRADESH"` → `"Ayodhya"`

#### `getCityRegex(cityName: string)`

- Creates case-insensitive regex that handles formatting variations
- Matches city name at start with optional spaces and comma
- Example: Matches both `"AYODHYA , UP"` and `"ayodhya, up"`

#### `areCitiesEquivalent(city1: string, city2: string)`

- Compares just the city names (before commas) in lowercase
- Returns true if cities are the same regardless of formatting

### 2. Automatic Normalization (Property Model)

#### Post-Save Hook

- **Always normalizes** city names when properties are saved
- **Auto-corrects** existing properties to use normalized names
- **Updates city counts** accurately using flexible regex matching
- **Prevents** future duplicate cities

#### Post-Remove Hook

- Updates city counts when properties are deleted
- Uses same flexible matching system

### 3. City Service Integration

- All city operations use normalized names
- Case-insensitive lookups throughout the system
- Consistent city creation and updates

## Prevention Features

### For Developers

1. **Automatic Normalization**: All new properties automatically get normalized city names
2. **Flexible Matching**: Database queries handle various formatting styles
3. **Self-Healing**: System corrects existing inconsistencies automatically
4. **Logging**: All normalization actions are logged for monitoring

### For Users

1. **Transparent**: Users don't notice any changes in functionality
2. **Consistent**: City listings always show proper formatting
3. **Accurate**: Property counts are always correct
4. **Reliable**: No more duplicate city entries

## Usage Examples

```typescript
import {
  normalizeCityName,
  getCityRegex,
  areCitiesEquivalent,
} from "@/lib/utils/city-utils";

// Normalize city names
normalizeCityName("MUMBAI , MAHARASHTRA"); // → "Mumbai"
normalizeCityName("delhi, india"); // → "Delhi"

// Create flexible regex
const regex = getCityRegex("Mumbai");
regex.test("MUMBAI , MAHARASHTRA"); // → true
regex.test("mumbai, mh"); // → true

// Compare cities
areCitiesEquivalent("DELHI , INDIA", "delhi, in"); // → true
```

## Database Queries

### Property Counting (Recommended)

```javascript
const propertyCount = await Property.countDocuments({
  isPublished: true,
  verificationStatus: "approved",
  status: "available",
  $or: [
    { "address.city": { $regex: getCityRegex(cityName) } },
    { "address.city": normalizedCityName },
  ],
});
```

### City Lookup (Recommended)

```javascript
const cityRegex = getCityRegex(cityName);
const city = await City.findOne({ name: { $regex: cityRegex } });
```

## Files Modified

- `lib/utils/city-utils.ts` - Core utility functions
- `models/Property.ts` - Auto-normalization hooks
- `services/cityService.ts` - Normalized operations
- Various API routes - Case-insensitive queries

## Testing

The system has been tested with:

- Mixed case variations
- Spacing differences
- Comma placement variations
- State/country suffixes
- Unicode characters

## Monitoring

- All normalization actions are logged to console
- Property count updates are tracked
- City name corrections are reported

## Future Maintenance

- No manual intervention required
- System is self-healing
- New properties automatically follow standards
- Existing data is gradually normalized

---

**Status**: ✅ Active and Working
**Last Updated**: January 2024
**Tested With**: Ayodhya duplicate city issue (resolved)
