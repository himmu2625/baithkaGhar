# Property Price Visibility Management

This system allows you to control whether prices are displayed on the frontend for all properties.

## Overview

The system consists of:
1. **Database Field**: `hidePrices` (boolean) on Property model
2. **Admin UI**: Hide/Show Prices button in admin/properties page
3. **API Endpoint**: `/api/admin/properties/toggle-prices`
4. **Scripts**: Command-line scripts to bulk hide/show prices

## Admin Interface

### Using the Button

1. Navigate to **Admin > Properties**
2. Look for the **"Hide All Prices"** or **"Show All Prices"** button in the top-right corner
3. Click the button to toggle price visibility for ALL properties
4. The button color indicates the current state:
   - **Orange**: Prices are currently visible (click to hide)
   - **Green**: Prices are currently hidden (click to show)

## Command-Line Scripts

### Hide All Prices

```bash
MONGODB_URI="mongodb+srv://admin:password@cluster.mongodb.net/" node scripts/hide-all-prices.cjs
```

This script:
- Sets `hidePrices = true` for ALL properties
- Shows progress and verification
- Reports how many properties were updated

### Show All Prices

```bash
MONGODB_URI="mongodb+srv://admin:password@cluster.mongodb.net/" node scripts/show-all-prices.cjs
```

This script:
- Sets `hidePrices = false` for ALL properties
- Shows progress and verification
- Reports how many properties were updated

## Initial Setup

To initially hide all property prices:

```bash
cd "C:\Users\Lenovo\Desktop\Baithaka GHAR website\my-app"
MONGODB_URI="your_mongodb_connection_string" node scripts/hide-all-prices.cjs
```

## API Endpoint

### Get Status
```
GET /api/admin/properties/toggle-prices
```

Response:
```json
{
  "success": true,
  "totalProperties": 100,
  "hiddenPricesCount": 50,
  "visiblePricesCount": 50,
  "allPricesHidden": false,
  "allPricesVisible": false
}
```

### Toggle Prices
```
POST /api/admin/properties/toggle-prices
Content-Type: application/json

{
  "hidePrices": true  // or false
}
```

To toggle a single property:
```json
{
  "propertyId": "property_id_here",
  "hidePrices": true
}
```

## Frontend Integration

In your property display components, check the `hidePrices` field:

```tsx
// Example
{property.hidePrices ? (
  <span className="text-gray-500">Price on request</span>
) : (
  <span className="font-bold">{formatCurrency(property.price)}</span>
)}
```

## Database Field

The `hidePrices` field in the Property model:
- **Type**: Boolean
- **Default**: false (prices visible)
- **Purpose**: Control frontend price display

## Notes

- ✅ Requires admin/super_admin role
- ✅ Changes take effect immediately
- ✅ Can be toggled for all properties or individual properties
- ✅ Fully reversible (can hide/show at any time)
- ⚠️  Frontend code must respect the `hidePrices` field
- ⚠️  Scripts require MongoDB connection string

## Troubleshooting

**Button not appearing?**
- Verify you're logged in as admin or super_admin
- Check browser console for errors

**Script fails?**
- Ensure MONGODB_URI is correct
- Verify MongoDB connection is accessible
- Check that the database name is correct

**Prices still showing on frontend?**
- Verify your frontend components check the `hidePrices` field
- Clear browser cache
- Check the API response includes `hidePrices` field

## Security

- Only admin and super_admin users can toggle price visibility
- API endpoint requires authentication
- Scripts require direct database access
