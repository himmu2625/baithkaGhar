# Phase 1: Database Schema Updates

**Phase:** 1 of 8
**Duration:** 1 week (December 17-23, 2025)
**Status:** 🟢 In Progress
**Focus:** Database schema updates for Owner System & Partial Payments

---

## 📋 Overview

Phase 1 focuses on updating the database schema to support:
1. **Property Owner Role** - New user role for property owners
2. **Owner Profile Fields** - Additional fields for owner information
3. **Partial Payment Support** - Fields to track split payments
4. **Payment Collection** - Hotel-side payment tracking

---

## 🎯 Objectives

### Primary Goals
- ✅ Update User model to add `property_owner` role
- ✅ Add owner profile fields to User model
- ✅ Update Property model with payment settings
- ✅ Update Booking model with partial payment fields
- ✅ Create migration scripts for existing data
- ✅ Maintain backward compatibility

### Success Criteria
- All models updated without breaking changes
- Migration script successfully updates existing records
- Backward compatibility maintained
- All tests passing
- No data loss during migration

---

## 📊 Schema Changes

### 1. User Model Updates

#### New Fields

```typescript
// Add to IUser interface
export interface IUser extends Document {
  // ... existing fields ...

  // NEW: Property Owner Role
  role: 'super_admin' | 'admin' | 'user' | 'travel_agent' | 'property_owner'

  // NEW: Owner Profile
  ownerProfile?: {
    propertyIds: mongoose.Types.ObjectId[]  // Properties owned
    businessName?: string                    // Business/company name
    businessType?: 'individual' | 'company' | 'partnership'
    gstNumber?: string                       // GST registration
    panNumber?: string                       // PAN for tax
    bankDetails?: {
      accountName: string
      accountNumber: string
      ifscCode: string
      bankName: string
      branchName: string
    }
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    contactPerson?: {
      name: string
      designation: string
      phone: string
      email: string
    }
    kycStatus?: 'pending' | 'verified' | 'rejected'
    kycDocuments?: {
      type: string                           // 'aadhar', 'pan', 'gst'
      number: string
      documentUrl: string
      verifiedAt?: Date
    }[]
    registeredAt?: Date                      // When owner was registered
    approvedBy?: mongoose.Types.ObjectId     // Admin who approved
    approvedAt?: Date
  }
}
```

#### Schema Definition

```typescript
const UserSchema = new Schema<IUser>({
  // ... existing fields ...

  role: {
    type: String,
    enum: ['super_admin', 'admin', 'user', 'travel_agent', 'property_owner'],
    default: 'user'
  },

  ownerProfile: {
    propertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    businessName: { type: String },
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership']
    },
    gstNumber: { type: String, uppercase: true },
    panNumber: { type: String, uppercase: true },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String, uppercase: true },
      bankName: { type: String },
      branchName: { type: String }
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'India' }
    },
    contactPerson: {
      name: { type: String },
      designation: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    kycDocuments: [{
      type: { type: String, enum: ['aadhar', 'pan', 'gst', 'other'] },
      number: { type: String },
      documentUrl: { type: String },
      verifiedAt: { type: Date }
    }],
    registeredAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
  }
})
```

#### Indexes

```typescript
UserSchema.index({ 'ownerProfile.kycStatus': 1 })
UserSchema.index({ 'ownerProfile.propertyIds': 1 })
UserSchema.index({ 'ownerProfile.gstNumber': 1 }, { sparse: true })
UserSchema.index({ 'ownerProfile.panNumber': 1 }, { sparse: true })
```

---

### 2. Property Model Updates

#### New Fields

```typescript
export interface IProperty extends Document {
  // ... existing fields ...

  // NEW: Payment Settings
  paymentSettings?: {
    partialPaymentEnabled: boolean
    minPartialPaymentPercent: number      // Minimum % (40-100)
    maxPartialPaymentPercent: number      // Maximum % (typically 100)
    defaultPartialPaymentPercent: number  // Default shown to guest (e.g., 50)

    // Payment collection at hotel
    hotelPaymentMethods: string[]         // ['cash', 'card', 'upi', 'net_banking']
    autoConfirmBooking: boolean           // Auto-confirm on partial payment

    // Commission & fees
    platformCommissionPercent: number     // Platform commission %
    paymentGatewayCharges: number         // Gateway charges %

    // Owner payout settings
    ownerPayoutSchedule: 'immediate' | 'after_checkin' | 'after_checkout' | 'monthly'
    ownerPayoutMinAmount: number          // Minimum amount for payout

    // Cancellation policy for partial payments
    partialPaymentCancellationPolicy?: {
      fullRefundDays: number              // Full refund if cancelled X days before
      partialRefundDays: number           // Partial refund if cancelled X days before
      partialRefundPercent: number        // % refunded in partial refund case
      noRefundDays: number                // No refund if cancelled < X days before
    }
  }

  // Owner information (link to User)
  ownerId?: mongoose.Types.ObjectId       // User ID of property owner
  ownerStatus?: 'active' | 'suspended' | 'pending'
}
```

#### Schema Definition

```typescript
const PropertySchema = new Schema<IProperty>({
  // ... existing fields ...

  paymentSettings: {
    partialPaymentEnabled: { type: Boolean, default: false },
    minPartialPaymentPercent: { type: Number, default: 40, min: 40, max: 100 },
    maxPartialPaymentPercent: { type: Number, default: 100, min: 40, max: 100 },
    defaultPartialPaymentPercent: { type: Number, default: 50, min: 40, max: 100 },

    hotelPaymentMethods: [{
      type: String,
      enum: ['cash', 'card', 'upi', 'net_banking', 'cheque']
    }],
    autoConfirmBooking: { type: Boolean, default: true },

    platformCommissionPercent: { type: Number, default: 15, min: 0, max: 50 },
    paymentGatewayCharges: { type: Number, default: 2.5, min: 0, max: 10 },

    ownerPayoutSchedule: {
      type: String,
      enum: ['immediate', 'after_checkin', 'after_checkout', 'monthly'],
      default: 'after_checkout'
    },
    ownerPayoutMinAmount: { type: Number, default: 1000, min: 0 },

    partialPaymentCancellationPolicy: {
      fullRefundDays: { type: Number, default: 7, min: 0 },
      partialRefundDays: { type: Number, default: 3, min: 0 },
      partialRefundPercent: { type: Number, default: 50, min: 0, max: 100 },
      noRefundDays: { type: Number, default: 1, min: 0 }
    }
  },

  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  ownerStatus: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'
  }
})
```

#### Indexes

```typescript
PropertySchema.index({ ownerId: 1 })
PropertySchema.index({ 'paymentSettings.partialPaymentEnabled': 1 })
PropertySchema.index({ ownerStatus: 1 })
```

---

### 3. Booking Model Updates

#### New Fields

```typescript
export interface IBooking extends Document {
  // ... existing fields ...

  // NEW: Partial Payment Fields
  isPartialPayment: boolean
  partialPaymentPercent?: number          // % paid online (40-100)
  onlinePaymentAmount?: number            // Amount paid online
  hotelPaymentAmount?: number             // Amount to be paid at hotel
  hotelPaymentStatus?: 'pending' | 'completed' | 'failed'
  hotelPaymentMethod?: string             // Method used at hotel
  hotelPaymentId?: string                 // Hotel payment reference
  hotelPaymentCompletedAt?: Date
  hotelPaymentCollectedBy?: mongoose.Types.ObjectId  // Owner/staff who collected

  // Payment breakdown
  paymentBreakdown?: {
    subtotal: number                      // Base amount
    taxes: number                         // Tax amount
    platformFee: number                   // Platform commission
    gatewayCharges: number                // Payment gateway fee
    totalAmount: number                   // Total booking amount
    onlineAmount: number                  // Amount paid online
    hotelAmount: number                   // Amount to pay at hotel
    ownerAmount: number                   // Amount payable to owner
  }

  // Owner payout tracking
  ownerPayoutStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  ownerPayoutAmount?: number
  ownerPayoutDate?: Date
  ownerPayoutReference?: string
  ownerPayoutMethod?: 'bank_transfer' | 'upi' | 'cheque'
}
```

#### Schema Definition

```typescript
const bookingSchema = new Schema<IBooking>({
  // ... existing fields ...

  // Partial payment fields
  isPartialPayment: { type: Boolean, default: false },
  partialPaymentPercent: { type: Number, min: 40, max: 100 },
  onlinePaymentAmount: { type: Number, min: 0 },
  hotelPaymentAmount: { type: Number, min: 0 },
  hotelPaymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  hotelPaymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'net_banking', 'cheque']
  },
  hotelPaymentId: { type: String },
  hotelPaymentCompletedAt: { type: Date },
  hotelPaymentCollectedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Payment breakdown
  paymentBreakdown: {
    subtotal: { type: Number, required: true, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    gatewayCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    onlineAmount: { type: Number, required: true, min: 0 },
    hotelAmount: { type: Number, default: 0, min: 0 },
    ownerAmount: { type: Number, required: true, min: 0 }
  },

  // Owner payout tracking
  ownerPayoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  ownerPayoutAmount: { type: Number, min: 0 },
  ownerPayoutDate: { type: Date },
  ownerPayoutReference: { type: String },
  ownerPayoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cheque']
  }
})
```

#### Indexes

```typescript
bookingSchema.index({ isPartialPayment: 1 })
bookingSchema.index({ hotelPaymentStatus: 1 })
bookingSchema.index({ ownerPayoutStatus: 1 })
bookingSchema.index({ propertyId: 1, hotelPaymentStatus: 1 })
bookingSchema.index({ hotelPaymentCollectedBy: 1 })
```

---

## 🔄 Migration Strategy

### Migration Plan

1. **Backup Database** ✅
   - Create full backup before any changes
   - Store in `backups/pre-phase1-migration/`

2. **Update Models**
   - Add new fields to interfaces
   - Update schema definitions
   - Add indexes

3. **Run Migration Script**
   - Add default values for new fields
   - Update existing records
   - Verify data integrity

4. **Test Migration**
   - Verify all records updated
   - Test backward compatibility
   - Run integration tests

5. **Rollback Plan**
   - Keep backup for 7 days
   - Document rollback procedure
   - Test rollback on staging

### Migration Script Tasks

```javascript
// Phase 1 Migration Script
async function migratePhase1() {
  // 1. Update User model
  await User.updateMany(
    { role: { $nin: ['property_owner'] } },
    { $set: { ownerProfile: null } }
  )

  // 2. Update Property model
  await Property.updateMany(
    {},
    {
      $set: {
        'paymentSettings.partialPaymentEnabled': false,
        'paymentSettings.minPartialPaymentPercent': 40,
        'paymentSettings.maxPartialPaymentPercent': 100,
        'paymentSettings.defaultPartialPaymentPercent': 50,
        'paymentSettings.hotelPaymentMethods': ['cash', 'card', 'upi'],
        'paymentSettings.autoConfirmBooking': true,
        'paymentSettings.platformCommissionPercent': 15,
        'paymentSettings.paymentGatewayCharges': 2.5,
        'paymentSettings.ownerPayoutSchedule': 'after_checkout',
        'paymentSettings.ownerPayoutMinAmount': 1000,
        ownerStatus: 'active'
      }
    }
  )

  // 3. Update Booking model
  await Booking.updateMany(
    { isPartialPayment: { $exists: false } },
    {
      $set: {
        isPartialPayment: false,
        hotelPaymentStatus: 'pending',
        ownerPayoutStatus: 'pending'
      }
    }
  )
}
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
// User model tests
describe('User Model - Property Owner', () => {
  test('should create user with property_owner role')
  test('should validate owner profile fields')
  test('should handle bank details validation')
  test('should manage KYC documents')
})

// Property model tests
describe('Property Model - Payment Settings', () => {
  test('should create property with payment settings')
  test('should validate partial payment percentages')
  test('should handle cancellation policy')
})

// Booking model tests
describe('Booking Model - Partial Payments', () => {
  test('should create booking with partial payment')
  test('should calculate payment breakdown correctly')
  test('should track hotel payment status')
  test('should manage owner payout')
})
```

### Integration Tests

```typescript
describe('Phase 1 Integration Tests', () => {
  test('should create property owner and property')
  test('should enable partial payments on property')
  test('should create booking with 50% partial payment')
  test('should track hotel payment collection')
  test('should calculate owner payout correctly')
})
```

---

## 📝 Backward Compatibility

### Ensuring Compatibility

1. **Default Values**
   - All new fields have sensible defaults
   - Existing bookings treated as full payment (isPartialPayment: false)
   - Existing properties have partial payments disabled

2. **Optional Fields**
   - All new fields are optional
   - Existing code continues to work
   - No breaking changes to APIs

3. **Gradual Rollout**
   - Feature flag: `ENABLE_PARTIAL_PAYMENTS`
   - Feature flag: `ENABLE_OWNER_SYSTEM`
   - Enable per-property basis

---

## ✅ Validation Rules

### User Model

- `role`: Must be one of allowed values
- `ownerProfile.gstNumber`: Format validation (if provided)
- `ownerProfile.panNumber`: Format validation (if provided)
- `ownerProfile.bankDetails.accountNumber`: Numeric validation
- `ownerProfile.bankDetails.ifscCode`: Format validation

### Property Model

- `paymentSettings.minPartialPaymentPercent`: 40-100
- `paymentSettings.maxPartialPaymentPercent`: 40-100
- `paymentSettings.defaultPartialPaymentPercent`: Between min and max
- `paymentSettings.platformCommissionPercent`: 0-50
- `ownerStatus`: Must be one of allowed values

### Booking Model

- `partialPaymentPercent`: 40-100
- `onlinePaymentAmount`: Must be >= 40% of total
- `hotelPaymentAmount`: Must be <= 60% of total
- `onlinePaymentAmount + hotelPaymentAmount`: Must equal totalPrice
- `paymentBreakdown.totalAmount`: Must match totalPrice

---

## 🚀 Deployment Steps

### Pre-Deployment

1. ✅ Create database backup
2. ✅ Run on staging environment
3. ✅ Verify migration success
4. ✅ Test backward compatibility
5. ✅ Update documentation

### Deployment

1. Enable maintenance mode (optional)
2. Run backup script: `npm run backup:db`
3. Deploy code changes
4. Run migration: `npm run phase1:migrate`
5. Verify migration results
6. Test critical flows
7. Monitor for errors

### Post-Deployment

1. Verify all services running
2. Check database indexes created
3. Monitor error logs
4. Test booking flow
5. Test owner dashboard (when ready)

---

## 📊 Success Metrics

### Technical Metrics

- ✅ All models updated successfully
- ✅ Migration completed without errors
- ✅ No data loss (100% records migrated)
- ✅ All indexes created successfully
- ✅ All tests passing (100%)

### Business Metrics

- Properties can enable partial payments
- Owners can be registered in system
- Bookings can track split payments
- Hotel payments can be collected
- Owner payouts can be tracked

---

## 🔍 Monitoring

### Key Metrics to Monitor

1. **Database Performance**
   - Query execution time
   - Index usage
   - Memory consumption

2. **Migration Status**
   - Records processed
   - Errors encountered
   - Time taken

3. **Application Health**
   - API response times
   - Error rates
   - User complaints

---

## 📖 Documentation Updates

### Files to Update

- [x] API documentation (for new fields)
- [x] User model documentation
- [x] Property model documentation
- [x] Booking model documentation
- [x] Migration guide
- [x] Rollback procedures

---

## ⚠️ Known Issues & Limitations

### Current Limitations

1. **Manual Owner Approval**
   - Owners must be manually approved by admin
   - No self-registration yet (coming in Phase 2)

2. **Payment Collection**
   - Hotel payment marking is manual
   - No automatic reconciliation (coming in Phase 4)

3. **Payout Processing**
   - Owner payouts are manual
   - No automatic bank transfer integration (future phase)

### Workarounds

- Admins can manually create property owners
- Hotel staff manually marks payments as received
- Finance team manually processes payouts

---

## 🎯 Next Phase Preview

### Phase 2: Authentication & Authorization

- Property owner login system
- Owner portal route structure
- Permission management
- Session handling
- Security measures

**Target Start:** December 23, 2025
**Duration:** 1 week

---

## 📞 Support

### Issues During Migration

- Check migration logs in `logs/phase1-migration.log`
- Verify backup exists in `backups/`
- Review rollback procedures in `docs/ROLLBACK_PROCEDURES.md`
- Contact development team if critical issues

---

**Phase 1 Status:** 🟢 In Progress
**Last Updated:** December 17, 2025
**Next Review:** December 20, 2025
