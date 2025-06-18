# Travel Picks System Setup Guide

## Overview

The Travel Picks system replaces the static "Guest Homes" section with a dynamic, data-driven display of the top 5 properties on your website. Properties are ranked based on multiple criteria including ratings, bookings, recent activity, and revenue.

## Features

- ✅ **Dynamic Property Ranking**: Automatically ranks properties based on performance metrics
- ✅ **Admin Management**: Full admin panel to view and update travel picks
- ✅ **Fallback Display**: Shows sample properties when no picks are configured
- ✅ **Weighted Scoring**: Sophisticated algorithm considering multiple factors
- ✅ **Real-time Updates**: Properties can be updated based on current booking data
- ✅ **Visual Indicators**: Ranking badges and "Travel Picks" branding

## Scoring Algorithm

The system uses a weighted scoring approach:

- **Rating (25%)**: Property star rating × 20 points (max 100)
- **Reviews (15%)**: Review count × 2 points (max 100)
- **Bookings (30%)**: Total bookings × 10 points (max 100)
- **Recent Activity (20%)**: Last 30 days bookings × 20 points (max 100)
- **Revenue (10%)**: Total revenue ÷ 1000 points (max 100)

## Quick Start

### 🎯 Automatic Updates (Recommended)

The Travel Picks system now **automatically updates** when:

- ✅ **New bookings are created** - Updates rankings based on booking activity
- ✅ **Reviews are added** - Adjusts scores when ratings change
- ✅ **Property ratings update** - Recalculates travel picks automatically

**No manual scripts needed for normal operation!**

### 1. Start Development Server

```bash
cd my-app
npm run dev
```

### 2. First Time Setup (Only if needed)

```bash
# Initialize travel picks with first 5 properties (one-time only)
npm run init-travel-picks
```

### 3. Manual Updates (Optional - rarely needed)

```bash
# Manual update if you want to force a refresh
npm run update-travel-picks
```

### 3. Access Admin Panel

1. Log in to your admin panel
2. Navigate to **Travel Picks** in the sidebar
3. View current rankings and metrics
4. Click "Update Rankings" if needed (automatic updates should handle this)

## File Structure

```
my-app/
├── models/
│   └── TravelPick.ts                    # Travel pick data model
├── app/
│   ├── api/admin/travel-picks/
│   │   └── route.ts                     # API endpoints
│   ├── admin/travel-picks/
│   │   └── page.tsx                     # Admin management page
│   └── page.tsx                         # Updated to use travel picks
├── components/layout/
│   ├── travel-picks.tsx                 # New travel picks component
│   └── guest-homes.tsx                  # Legacy component (can be removed)
└── scripts/
    ├── initialize-travel-picks.js       # Initial setup script
    └── update-travel-picks.js           # Update rankings script
```

## API Endpoints

### GET `/api/admin/travel-picks`

Fetches current travel picks for display on the homepage.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "propertyId": {
        "title": "Property Name",
        "location": "City, State",
        "price": { "base": 12500 },
        "rating": 4.8,
        "reviewCount": 124
      },
      "rank": 1,
      "score": 87.5,
      "metrics": {
        "rating": 4.8,
        "reviewCount": 124,
        "bookingCount": 45,
        "recentBookings": 8,
        "revenue": 125000,
        "occupancyRate": 0.85
      }
    }
  ]
}
```

### POST `/api/admin/travel-picks`

Updates travel picks based on current property metrics (admin only).

**Request:**

```json
{
  "isAdminRequest": true
}
```

## Database Schema

The `TravelPick` model stores:

```javascript
{
  propertyId: ObjectId,           // Reference to Property
  rank: Number,                   // 1-5 ranking
  score: Number,                  // Calculated score
  metrics: {
    rating: Number,               // Property rating
    reviewCount: Number,          // Number of reviews
    bookingCount: Number,         // Total bookings
    recentBookings: Number,       // Bookings in last 30 days
    revenue: Number,              // Total revenue
    occupancyRate: Number         // Occupancy percentage
  },
  isActive: Boolean,              // Whether this pick is active
  createdAt: Date,
  updatedAt: Date
}
```

## Component Usage

The Travel Picks component automatically:

- Fetches current travel picks from the API
- Falls back to sample data if no picks exist
- Displays properties with ranking badges
- Links to individual property pages
- Shows loading states and error handling

## Automation Options

### Schedule Regular Updates

You can set up automatic updates using cron jobs or task schedulers:

```bash
# Update travel picks daily at 2 AM
0 2 * * * cd /path/to/your/app/my-app && npm run update-travel-picks
```

### Webhook Integration

Trigger updates when new bookings are created by calling the API endpoint:

```javascript
// After a successful booking
fetch("/api/admin/travel-picks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ isAdminRequest: false }),
});
```

## Customization

### Modify Scoring Weights

Edit the weights in `/api/admin/travel-picks/route.ts`:

```javascript
const weights = {
  rating: 0.25, // 25% weight
  reviews: 0.15, // 15% weight
  bookings: 0.3, // 30% weight
  recent: 0.2, // 20% weight
  revenue: 0.1, // 10% weight
};
```

### Change Number of Picks

To show more/fewer than 5 properties, update:

1. The limit in the API query
2. The TravelPick schema max rank validation
3. The frontend grid layout if needed

### Custom Styling

The travel picks use these CSS classes:

- `travel-picks-container`
- `travel-pick-card`
- `travel-pick-rank-badge`

## Troubleshooting

### No Properties Showing

1. Ensure you have published and approved properties
2. Run the initialization script
3. Check the admin panel for any errors

### Rankings Not Updating

1. Verify you have booking data in your database
2. Run the update script manually
3. Check console logs for any errors

### API Errors

1. Ensure MongoDB connection is working
2. Verify admin authentication is set up
3. Check server logs for detailed error messages

## Migration from Guest Homes

The old Guest Homes component has been replaced but not deleted. If you want to completely remove it:

1. Delete `components/layout/guest-homes.tsx`
2. Remove any remaining imports
3. Clean up any references in other files

## Support

For issues or questions:

1. Check the admin panel Travel Picks page for system status
2. Review the console logs for error messages
3. Ensure all dependencies are installed
4. Verify your MongoDB connection and data structure

---

_Last updated: January 2025_
