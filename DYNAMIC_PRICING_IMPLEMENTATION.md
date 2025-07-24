# Dynamic Pricing Implementation

## Overview

This document describes the complete dynamic pricing system implemented for the Baithaka GHAR website. The system allows property owners to set flexible pricing based on various factors like seasonality, demand, and competition.

## Features Implemented

### ✅ Core Features

- **Base Pricing**: Set minimum and maximum price bounds
- **Seasonal Pricing**: Different rates for peak, off-peak, and shoulder seasons
- **Weekly Pricing**: Different rates for each day of the week
- **Demand-based Pricing**: Adjust prices based on occupancy levels
- **Advance Booking Discounts**: Discounts for early bookings
- **Last-minute Premium**: Premium for last-minute bookings
- **Event-based Pricing**: Price adjustments for local events, festivals, conferences
- **Competition Sensitivity**: Adjust prices based on competitor rates
- **Real-time Price Preview**: See calculated prices for specific dates

### ✅ Admin Controls

- **Property-specific Controls**: Each property has its own pricing settings
- **Global Settings**: System-wide pricing rules
- **Real-time Updates**: Instant price calculation and preview
- **Validation**: Input validation and error handling

## Database Schema

### Property Model Updates

```typescript
// Added to Property model
dynamicPricing: {
  enabled: boolean;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  seasonalRates: {
    peak: { multiplier: number; months: number[] };
    offPeak: { multiplier: number; months: number[] };
    shoulder: { multiplier: number; months: number[] };
  };
  weeklyRates: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  demandPricing: {
    lowOccupancy: number;
    mediumOccupancy: number;
    highOccupancy: number;
  };
  competitionSensitivity: number;
  advanceBookingDiscounts: {
    "30+ days": number;
    "15-30 days": number;
    "7-15 days": number;
    "1-7 days": number;
  };
  eventPricing: {
    localEvents: number;
    festivals: number;
    conferences: number;
  };
  lastMinutePremium: number;
  autoPricing: {
    enabled: boolean;
    minMultiplier: number;
    maxMultiplier: number;
  };
}
```

## API Endpoints

### 1. Admin Pricing Management

```
GET /api/admin/properties/[id]/pricing
PUT /api/admin/properties/[id]/pricing
```

### 2. Public Pricing Calculation

```
GET /api/properties/[id]/pricing?startDate=2024-12-25&endDate=2024-12-28&guests=2
```

## Admin Interface

### Property Edit Modal

- Added "Dynamic Pricing" button in the footer
- Opens pricing page in new tab

### Properties List

- Added "Dynamic Pricing" option in dropdown menu
- Quick access to pricing settings

### Pricing Page (`/admin/properties/[id]/pricing`)

- **Enable/Disable**: Toggle dynamic pricing on/off
- **Basic Pricing**: Set base, min, max prices
- **Seasonal Pricing**: Configure peak, off-peak, shoulder rates
- **Weekly Pricing**: Set rates for each day
- **Advanced Settings**: Demand, competition, events, discounts
- **Price Preview**: Real-time calculation and preview

## Price Calculation Logic

### Formula

```
Final Price = Base Price × Seasonal Multiplier × Weekly Multiplier × Demand Multiplier × (1 - Advance Discount) × (1 + Last-minute Premium)
```

### Constraints

- Price is clamped between `minPrice` and `maxPrice`
- All multipliers have validation ranges
- Discounts and premiums are percentage-based

### Factors Applied

1. **Seasonal**: Peak (1.5x), Off-peak (0.8x), Shoulder (1.1x)
2. **Weekly**: Monday-Friday (1.0x), Saturday (1.2x), Sunday (1.1x)
3. **Demand**: Low (<30%): 0.9x, Medium (30-70%): 1.0x, High (>70%): 1.3x
4. **Advance Booking**: 30+ days: 15%, 15-30 days: 10%, 7-15 days: 5%
5. **Last-minute**: 7 days or less: +15% premium

## File Structure

```
my-app/
├── models/Property.ts                    # Updated with dynamicPricing field
├── app/api/admin/properties/[id]/pricing/route.ts  # Admin API
├── app/api/properties/[id]/pricing/route.ts        # Public API
├── app/admin/properties/[id]/pricing/page.tsx      # Admin interface
├── lib/utils/dynamic-pricing.ts         # Utility functions
├── scripts/test-dynamic-pricing.js      # Test script
└── components/admin/property/PropertyEditModal.tsx  # Updated with pricing button
```

## Usage Guide

### For Property Owners

1. Go to Admin Dashboard → Properties
2. Click "Edit" on any property
3. Click "Dynamic Pricing" button
4. Enable dynamic pricing
5. Configure base pricing and multipliers
6. Set seasonal and weekly rates
7. Configure advanced settings
8. Use price preview to test calculations
9. Save settings

### For Developers

1. **API Integration**: Use `/api/properties/[id]/pricing` for price calculations
2. **Admin Access**: Use `/api/admin/properties/[id]/pricing` for management
3. **Utility Functions**: Import from `lib/utils/dynamic-pricing.ts`
4. **Testing**: Run `scripts/test-dynamic-pricing.js`

## Configuration Examples

### Basic Setup

```typescript
{
  enabled: true,
  basePrice: 2000,
  minPrice: 1500,
  maxPrice: 5000,
  seasonalRates: {
    peak: { multiplier: 1.5, months: [11, 0, 1, 2] },
    offPeak: { multiplier: 0.8, months: [5, 6, 7, 8] },
    shoulder: { multiplier: 1.1, months: [3, 4, 9, 10] }
  }
}
```

### Advanced Setup

```typescript
{
  enabled: true,
  basePrice: 3000,
  minPrice: 2000,
  maxPrice: 8000,
  weeklyRates: {
    monday: 1.0, tuesday: 1.0, wednesday: 1.0,
    thursday: 1.0, friday: 1.0, saturday: 1.3, sunday: 1.2
  },
  advanceBookingDiscounts: {
    "30+ days": 20, "15-30 days": 15, "7-15 days": 10, "1-7 days": 0
  },
  lastMinutePremium: 20,
  eventPricing: {
    localEvents: 25, festivals: 40, conferences: 30
  }
}
```

## Testing

### Run Test Script

```bash
cd my-app
node scripts/test-dynamic-pricing.js
```

### Manual Testing

1. Create a property with dynamic pricing enabled
2. Set different seasonal and weekly rates
3. Use the price preview feature
4. Test with different date ranges
5. Verify price calculations are correct

## Validation Rules

### Price Bounds

- Base Price: > 0
- Min Price: ≥ 0
- Max Price: > Min Price

### Multipliers

- Seasonal: 0.3x to 3.0x
- Weekly: 0.5x to 2.0x
- Demand: 0.5x to 2.0x

### Discounts & Premiums

- Advance Booking: 0% to 50%
- Last-minute Premium: 0% to 100%
- Event Premium: 0% to 100%

## Future Enhancements

### Phase 2 Features

- **AI-powered Optimization**: Machine learning for price optimization
- **Competitor Monitoring**: Real-time competitor price tracking
- **Demand Prediction**: Predictive analytics for demand forecasting
- **Revenue Analytics**: Advanced reporting and analytics
- **Mobile App Integration**: Dynamic pricing in mobile app

### Phase 3 Features

- **Market Analysis**: Industry benchmarking
- **Guest Segmentation**: Different pricing for different customer types
- **Dynamic Rules Engine**: Custom pricing rules
- **A/B Testing**: Test different pricing strategies
- **Automated Optimization**: Self-adjusting prices

## Troubleshooting

### Common Issues

1. **Prices not updating**: Check if dynamic pricing is enabled
2. **Invalid prices**: Verify min/max price bounds
3. **API errors**: Check property ID and date format
4. **Preview not working**: Ensure start/end dates are valid

### Debug Mode

Enable debug logging in the pricing calculation API to see detailed calculations.

## Performance Considerations

- **Caching**: Price calculations are cached for 5 minutes
- **Database Indexes**: Added indexes for dynamic pricing queries
- **API Optimization**: Efficient queries and response formatting
- **Frontend**: Lazy loading and pagination for large datasets

## Security

- **Admin Authentication**: All admin endpoints require admin role
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints have rate limiting
- **Data Encryption**: Sensitive pricing data is encrypted

## Support

For technical support or questions about the dynamic pricing implementation:

1. Check the test script for basic functionality
2. Review the API documentation
3. Check the admin interface for configuration issues
4. Contact the development team for advanced issues

---

**Implementation Date**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Production
