const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';

async function backupAndResetPricing() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define PropertyPricing model
    const PropertyPricing = mongoose.model('PropertyPricing', new mongoose.Schema({}, { strict: false, collection: 'propertypricing' }));

    // ==================== STEP 1: BACKUP ====================
    console.log('📦 STEP 1: Backing up existing pricing data...');

    const allPricing = await PropertyPricing.find({}).lean();
    console.log(`Found ${allPricing.length} pricing entries to backup`);

    if (allPricing.length > 0) {
      const backupDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `pricing-backup-${timestamp}.json`);

      fs.writeFileSync(backupFile, JSON.stringify(allPricing, null, 2));
      console.log(`✅ Backup saved to: ${backupFile}\n`);
    }

    // ==================== STEP 2: ANALYZE CURRENT STATE ====================
    console.log('📊 STEP 2: Analyzing current pricing state...');

    const properties = await PropertyPricing.distinct('propertyId');
    console.log(`Found ${properties.length} properties with pricing data:`);

    for (const propertyId of properties) {
      const count = await PropertyPricing.countDocuments({ propertyId });
      const types = await PropertyPricing.distinct('pricingType', { propertyId });
      console.log(`  - Property ${propertyId}: ${count} entries (Types: ${types.join(', ')})`);
    }
    console.log();

    // ==================== STEP 3: RESET PLAN_BASED TO BASELINE ====================
    console.log('🔄 STEP 3: Resetting all PLAN_BASED pricing to baseline...');

    const planBasedEntries = await PropertyPricing.find({
      pricingType: 'PLAN_BASED'
    });

    console.log(`Found ${planBasedEntries.length} PLAN_BASED entries to reset`);

    let resetCount = 0;
    for (const entry of planBasedEntries) {
      await PropertyPricing.updateOne(
        { _id: entry._id },
        {
          $set: {
            price: 0,
            isAvailable: false,
            updatedAt: new Date()
          }
        }
      );
      resetCount++;
      if (resetCount % 50 === 0) {
        console.log(`  Progress: ${resetCount}/${planBasedEntries.length} entries reset`);
      }
    }

    console.log(`✅ Reset ${resetCount} PLAN_BASED entries to price=0, isAvailable=false\n`);

    // ==================== STEP 4: CLEAN UP DIRECT PRICING ====================
    console.log('🗑️  STEP 4: Cleaning up DIRECT pricing overrides...');

    const directCount = await PropertyPricing.countDocuments({ pricingType: 'DIRECT' });
    console.log(`Found ${directCount} DIRECT pricing entries`);

    if (directCount > 0) {
      console.log('⚠️  Keeping DIRECT entries for now. Delete manually if needed.');
      console.log('   Use: db.propertypricing.deleteMany({ pricingType: "DIRECT" })\n');
    }

    // ==================== STEP 5: VERIFY RESET ====================
    console.log('✅ STEP 5: Verifying reset...');

    const verifyCount = await PropertyPricing.countDocuments({
      pricingType: 'PLAN_BASED',
      $or: [
        { price: { $ne: 0 } },
        { isAvailable: { $ne: false } }
      ]
    });

    if (verifyCount === 0) {
      console.log('✅ All PLAN_BASED entries successfully reset to baseline');
    } else {
      console.log(`⚠️  Warning: ${verifyCount} entries may not have been fully reset`);
    }

    // ==================== STEP 6: SUMMARY ====================
    console.log('\n📋 RESET SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`Total properties: ${properties.length}`);
    console.log(`PLAN_BASED entries reset: ${resetCount}`);
    console.log(`DIRECT entries kept: ${directCount}`);
    console.log(`Backup location: scripts/backups/`);
    console.log('═'.repeat(50));
    console.log('\n✨ Next Steps:');
    console.log('1. Run initialization script to set base prices');
    console.log('2. Use admin panel to configure plan-based pricing');
    console.log('3. Import Excel sheets if needed');
    console.log('4. Apply direct pricing overrides as needed\n');

  } catch (error) {
    console.error('❌ Error during backup/reset:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  backupAndResetPricing()
    .then(() => {
      console.log('✅ Backup and reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = backupAndResetPricing;
