# Unified Promotion System Migration

## Overview

We have successfully merged the three separate discount systems (Coupons, Special Offers, and Promotions) into a single, powerful **Unified Promotion System**. This consolidation simplifies management while providing more flexibility and power.

## What Changed

### Before (3 separate systems):

- **Coupons**: Code-based discounts that users enter at checkout
- **Special Offers**: Visual promotional banners with basic discount info
- **Promotions**: Complex rule-based campaign system

### After (1 unified system):

- **Promotions**: A comprehensive system that handles all types of discounts and offers
- Supports coupon codes, automatic discounts, visual banners, complex rules, and more
- All managed from a single admin interface

## Features of the Unified System

### Coupon Functionality

- ✅ Coupon codes (fixed or auto-generated)
- ✅ Usage limits (total and per-customer)
- ✅ Percentage and fixed amount discounts
- ✅ Minimum order amounts
- ✅ Maximum discount caps
- ✅ User and property targeting/exclusions
- ✅ Date-based validity

### Special Offer Functionality

- ✅ Visual display settings (images, labels, tags)
- ✅ Property targeting
- ✅ Automatic application (no code required)
- ✅ Priority-based display ordering
- ✅ Show/hide on different pages

### Advanced Promotion Features

- ✅ Complex rule-based conditions
- ✅ Multiple discount types (percentage, fixed, buy-x-get-y, free nights)
- ✅ Seasonal and time-based triggers
- ✅ Customer segmentation
- ✅ Analytics and tracking
- ✅ Approval workflows
- ✅ Automation triggers

## Migration Process

### Automatic Migration

The system includes a built-in migration tool that safely transfers your existing data:

1. **Access Migration**: Go to `/admin/migration` or use the "Migrate Data" button in promotions
2. **Review Status**: See what needs to be migrated
3. **Run Migration**: Migrate coupons, special offers, or both
4. **Verify Results**: Check that everything migrated correctly

### Migration Safety

- ✅ **Non-destructive**: Original data is preserved
- ✅ **Repeatable**: Can run multiple times safely
- ✅ **Incremental**: Only migrates new/unchanged items
- ✅ **Reversible**: Original systems remain functional as fallback

### What Gets Migrated

#### Coupons → Promotions

```
Original Coupon          →  New Promotion
├── code                →  couponCode
├── name                →  name
├── description         →  description
├── type                →  discountType
├── value               →  discountValue
├── minOrderAmount      →  conditions.minBookingAmount
├── usageLimit          →  conditions.usageLimit
├── userUsageLimit      →  conditions.usageLimitPerCustomer
├── validFrom/To        →  conditions.validFrom/validTo
├── applicableFor       →  conditions.applicableFor
├── applicableProperties→  conditions.applicableProperties
├── excludedProperties  →  conditions.excludeProperties
└── excludedUsers       →  conditions.excludedUsers
```

#### Special Offers → Promotions

```
Original Special Offer   →  New Promotion
├── title               →  name
├── description         →  description
├── label               →  displaySettings.label
├── tag                 →  displaySettings.tag
├── imageUrl            →  displaySettings.imageUrl
├── publicId            →  displaySettings.publicId
├── validUntil          →  conditions.validTo
├── targetProperties    →  targetProperties
└── isActive            →  isActive
```

## Using the Unified System

### Creating Promotions

#### 1. Coupon-Style Promotion

```typescript
{
  type: 'coupon',
  discountType: 'percentage',
  discountValue: 10,
  conditions: {
    requiresCouponCode: true,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 100,
    usageLimitPerCustomer: 1
  },
  couponCode: 'SAVE10',
  displaySettings: {
    title: '10% Off Coupon',
    showAtCheckout: true
  }
}
```

#### 2. Special Offer-Style Promotion

```typescript
{
  type: 'special_offer',
  discountType: 'percentage',
  discountValue: 20,
  conditions: {
    requiresCouponCode: false,
    validFrom: '2024-01-01',
    validTo: '2024-01-31'
  },
  displaySettings: {
    title: 'New Year Special',
    label: '20% OFF',
    imageUrl: 'https://example.com/banner.jpg',
    showInSearch: true,
    showOnPropertyPage: true,
    priority: 8
  },
  targetProperties: ['property_id_1', 'property_id_2']
}
```

#### 3. Advanced Rule-Based Promotion

```typescript
{
  type: 'early_bird',
  discountType: 'percentage',
  discountValue: 15,
  conditions: {
    requiresCouponCode: false,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    advanceBookingDays: { min: 30 },
    minStayNights: 3,
    weekendsOnly: true
  },
  automation: {
    autoActivate: true,
    triggerConditions: {
      lowOccupancy: 70
    }
  }
}
```

### API Compatibility

#### Coupon Validation (Backward Compatible)

The existing `/api/coupons/validate` endpoint now works with both old coupons and new promotions:

```typescript
// Request (unchanged)
POST /api/coupons/validate
{
  "code": "SAVE10",
  "bookingAmount": 1000,
  "propertyId": "property_123"
}

// Response (enhanced)
{
  "valid": true,
  "coupon": { /* coupon details */ },
  "discount": { /* discount calculation */ },
  "source": "promotion" // or "coupon" for legacy
}
```

## Admin Interface

### Navigation Changes

- ❌ Removed: "Coupons" menu item
- ❌ Removed: "Special Offers" menu item
- ✅ Enhanced: "Promotions" now handles everything

### New Features

- **Migration Dashboard**: Easy-to-use migration interface
- **Type Filtering**: Filter promotions by type (coupon, special_offer, etc.)
- **Template Creation**: Quick templates for common promotion types
- **Bulk Operations**: Manage multiple promotions at once

## Database Schema

### New Fields in Promotion Model

```typescript
interface IPromotion {
  // Core fields (existing)
  name: string;
  type: 'coupon' | 'special_offer' | 'early_bird' | ... ;

  // Enhanced conditions (merged from Coupon)
  conditions: {
    applicableFor?: 'all' | 'specific_properties' | 'specific_users';
    applicableUsers?: ObjectId[];
    excludedUsers?: ObjectId[];
    userUsageLimit?: number; // alias for usageLimitPerCustomer
    // ... other conditions
  };

  // Enhanced display settings (merged from SpecialOffer)
  displaySettings: {
    imageUrl?: string;
    publicId?: string;
    label?: string;
    tag?: string;
    // ... other display settings
  };

  // Property targeting (enhanced)
  targetProperties?: ObjectId[];

  // Migration tracking
  migratedFrom?: 'coupon' | 'special_offer';
  originalId?: string;
}
```

## Best Practices

### 1. Migration Strategy

- Run migration during low-traffic periods
- Test on staging environment first
- Verify all existing functionality works
- Monitor for any issues after migration

### 2. Creating New Promotions

- Use descriptive names that indicate the promotion type
- Set appropriate priority levels for display ordering
- Configure analytics tracking for performance monitoring
- Use automation features for dynamic promotions

### 3. Management

- Regularly review active promotions
- Archive completed or expired promotions
- Monitor usage analytics
- A/B test different promotion strategies

## Troubleshooting

### Common Issues

#### Migration Errors

- **Issue**: Migration fails with validation errors
- **Solution**: Check that all required fields are present in source data

#### Coupon Validation Not Working

- **Issue**: Existing coupon codes not being recognized
- **Solution**: Ensure migration completed successfully, check promotion status

#### Display Issues

- **Issue**: Special offers not showing correctly
- **Solution**: Verify display settings are configured properly after migration

### Support

For additional support or issues:

1. Check the migration status at `/admin/migration`
2. Review promotion settings at `/admin/promotions`
3. Check server logs for detailed error messages
4. Use the "Refresh Status" button to update migration information

## Conclusion

The unified promotion system provides:

- **Simplified Management**: One interface for all discount types
- **Enhanced Features**: More powerful rules and conditions
- **Better Analytics**: Comprehensive tracking and reporting
- **Future-Proof**: Extensible system for new promotion types
- **Backward Compatibility**: Existing functionality preserved

The migration is designed to be seamless and non-disruptive, ensuring your existing promotions continue to work while providing access to powerful new features.
