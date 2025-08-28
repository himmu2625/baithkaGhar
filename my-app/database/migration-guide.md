# 🗄️ OTA Channel Manager Database Migration Guide

## 📋 Overview

This guide helps you migrate your existing Baithaka Ghar system to support the new OTA Channel Manager functionality. The new schema adds four main collections/tables to handle multi-hotel OTA integration.

## 🔄 Migration Strategy

### Phase 1: Add New Models (Non-Breaking)
1. Deploy new MongoDB models alongside existing ones
2. No changes to existing Property model
3. New models start empty - no data migration needed initially

### Phase 2: Data Population
1. Create OTA configurations for existing properties
2. Import historical bookings from OTAs (if needed)
3. Set up sync schedules

### Phase 3: Integration
1. Enable OTA endpoints
2. Start syncing operations
3. Monitor and optimize

## 🚀 Step-by-Step Migration

### Step 1: Deploy New Models

The new models work alongside your existing schema:

```javascript
// Existing models remain unchanged:
// - Property.ts (your current model)
// - Booking.ts (your current model) 
// - User.ts, Room.ts, etc.

// New OTA-specific models:
// - OTAChannelConfig.ts (NEW)
// - OTABooking.ts (NEW) 
// - InventorySyncLog.ts (NEW)
```

### Step 2: Link Existing Properties

Create a migration script to link existing properties:

```javascript
// scripts/migrate-existing-properties.js
import Property from '../models/Property.js'; // Your existing model
import OTAChannelConfig from '../models/OTAChannelConfig.js'; // New model

async function migrateExistingProperties() {
  const properties = await Property.find({ status: 'active' });
  
  console.log(`Found ${properties.length} existing properties to migrate`);
  
  for (const property of properties) {
    // Create OTA configuration placeholder for each property
    const otaConfig = new OTAChannelConfig({
      propertyId: property._id.toString(),
      propertyName: property.title, // Map to your existing field name
      
      // Start with OTA disabled - hotels will enable manually
      otaIntegrationEnabled: false,
      channels: [],
      
      // Map existing property data
      globalSettings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        rateIncludesTax: true
      },
      
      // Contact info from existing property
      contactInfo: {
        managerEmail: property.ownerEmail, // Map to your field
        // Add other contact fields as available
      }
    });
    
    try {
      await otaConfig.save();
      console.log(`✅ Migrated property: ${property.title}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${property.title}:`, error.message);
    }
  }
  
  console.log('Migration completed!');
}

// Run migration
migrateExistingProperties().catch(console.error);
```

### Step 3: Update Property Model (Optional Enhancement)

Add OTA-related fields to your existing Property model:

```javascript
// Add to your existing Property schema
const PropertySchema = new Schema({
  // ... your existing fields ...
  
  // Add these new fields (optional, for enhanced integration)
  otaIntegrationEnabled: {
    type: Boolean,
    default: false
  },
  otaChannelsCount: {
    type: Number,
    default: 0
  },
  lastOTASyncAt: Date,
  
  // ... rest of your existing fields ...
});
```

### Step 4: Create Indexes

Run this script to create performance indexes:

```javascript
// scripts/create-indexes.js
import mongoose from 'mongoose';
import OTAChannelConfig from '../models/OTAChannelConfig.js';
import OTABooking from '../models/OTABooking.js';
import InventorySyncLog from '../models/InventorySyncLog.js';

async function createIndexes() {
  console.log('Creating indexes for OTA collections...');
  
  // The indexes are already defined in the models, 
  // but you can manually ensure they exist:
  
  await OTAChannelConfig.createIndexes();
  await OTABooking.createIndexes();  
  await InventorySyncLog.createIndexes();
  
  console.log('✅ All indexes created successfully');
}

createIndexes().catch(console.error);
```

## 🔗 Integration Points

### Link OTA Bookings to Existing Bookings

If you want to connect OTA bookings to your existing booking system:

```javascript
// In your existing Booking model, add:
const BookingSchema = new Schema({
  // ... your existing fields ...
  
  // Link to OTA booking if it came from OTA
  otaBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'OTABooking'
  },
  bookingSource: {
    type: String,
    enum: ['direct', 'booking.com', 'oyo', 'makemytrip', 'airbnb'],
    default: 'direct'
  }
});
```

### Property Statistics Enhancement

Update property stats to include OTA data:

```javascript
// Add to your Property model methods
PropertySchema.methods.calculateStats = async function() {
  const otaBookings = await OTABooking.find({ propertyId: this._id });
  const otaRevenue = otaBookings.reduce((sum, booking) => 
    sum + (booking.amount?.totalAmount || 0), 0);
  
  return {
    // ... your existing stats ...
    otaBookingsCount: otaBookings.length,
    otaRevenue: otaRevenue,
    totalRevenue: this.stats.totalRevenue + otaRevenue
  };
};
```

## 📊 Data Migration Strategies

### Option 1: Fresh Start (Recommended)
- Deploy new OTA models
- Properties start with OTA disabled
- Hotels configure OTA channels as needed
- New bookings flow through system

### Option 2: Historical Import
- Deploy new OTA models  
- Import last 30-90 days of bookings from OTA APIs
- Populate historical sync logs
- More complex but provides historical data

### Option 3: Hybrid Approach
- Deploy new models
- Import only recent bookings (last 7 days)
- Configure channels for active properties
- Balance between simplicity and data completeness

## 🛠️ Migration Scripts

### Complete Migration Script

```javascript
// scripts/full-ota-migration.js
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import OTAChannelConfig from '../models/OTAChannelConfig.js';
import { dbConnect } from '../lib/db/index.js';

async function fullOTAMigration() {
  try {
    await dbConnect();
    console.log('🚀 Starting OTA migration...');
    
    // Step 1: Create indexes
    console.log('📊 Creating indexes...');
    await OTAChannelConfig.createIndexes();
    console.log('✅ Indexes created');
    
    // Step 2: Migrate existing properties
    console.log('🏨 Migrating existing properties...');
    const properties = await Property.find({ status: 'active' });
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const property of properties) {
      try {
        // Check if already migrated
        const existing = await OTAChannelConfig.findOne({ 
          propertyId: property._id.toString() 
        });
        
        if (existing) {
          console.log(`⏭️  Skipping ${property.title} - already migrated`);
          continue;
        }
        
        // Create OTA configuration
        const otaConfig = new OTAChannelConfig({
          propertyId: property._id.toString(),
          propertyName: property.title,
          otaEnabled: false, // Start disabled
          channels: [], // Empty - hotel will configure
          globalSettings: {
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            checkInTime: '14:00',
            checkOutTime: '11:00'
          },
          contactInfo: {
            managerEmail: property.ownerEmail
          }
        });
        
        await otaConfig.save();
        migratedCount++;
        console.log(`✅ Migrated: ${property.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating ${property.title}:`, error.message);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total properties: ${properties.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('\n🎉 OTA migration completed!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fullOTAMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { fullOTAMigration };
```

### Run Migration

```bash
# Add to package.json scripts:
"migrate:ota": "node scripts/full-ota-migration.js"

# Run migration:
npm run migrate:ota
```

## ✅ Verification Steps

After migration, verify everything works:

### 1. Check Database
```javascript
// Verify migration success
const totalProperties = await Property.countDocuments();
const migratedOTA = await OTAChannelConfig.countDocuments();

console.log(`Properties: ${totalProperties}`);
console.log(`OTA Configs: ${migratedOTA}`);
console.log(`Migration coverage: ${(migratedOTA/totalProperties*100).toFixed(1)}%`);
```

### 2. Test API Endpoints
```bash
# Test property OTA config endpoint
curl http://localhost:3000/api/os/ota-config/[property_id]

# Should return property's OTA configuration
```

### 3. Test UI Access
Visit: `http://localhost:3000/os/ota-config/[property_id]`
Should show OTA configuration interface.

## 🚨 Rollback Plan

If issues arise, you can safely rollback:

### 1. Disable OTA Features
```javascript
// Temporarily disable OTA endpoints
// Comment out OTA routes in your API
```

### 2. Remove OTA Collections (if needed)
```javascript
// Only if major issues - this will lose OTA configuration data
await mongoose.connection.db.dropCollection('otachannelconfigs');
await mongoose.connection.db.dropCollection('otabookings');
await mongoose.connection.db.dropCollection('inventorysynclogs');
```

### 3. Restore Previous Version
```bash
# Deploy previous application version
git checkout previous-stable-version
npm run build
npm run start
```

## 🔒 Security Considerations

### 1. Encrypt Sensitive Data
- OTA API keys are automatically encrypted in the model
- Set `OTA_ENCRYPTION_KEY` environment variable (32 characters)

### 2. Access Control
- Only property owners can view/edit their OTA configs
- Admin users can view but not edit credentials
- Audit logging for credential access

### 3. Data Retention
- Sync logs auto-expire after 90 days
- Booking data retained based on business requirements
- GDPR compliance built into models

## 📈 Monitoring Post-Migration

### 1. Application Performance
- Monitor database query performance
- Watch for new slow queries
- Check memory usage with new models

### 2. Data Quality
- Verify OTA configurations are being created correctly
- Monitor sync success rates
- Check for data mapping issues

### 3. User Experience  
- Monitor property owner adoption
- Track configuration completion rates
- Gather feedback on OTA setup process

---

**Migration Complete!** 🎉

Your Baithaka Ghar system now supports multi-hotel OTA channel management while maintaining full backward compatibility with existing functionality.