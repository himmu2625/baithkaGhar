/**
 * Phase 1 Database Migration Script
 * Updates User, Property, and Booking models for Owner System & Partial Payments
 *
 * This script:
 * 1. Adds property_owner role support to User model
 * 2. Adds payment settings to Property model
 * 3. Adds partial payment fields to Booking model
 * 4. Ensures backward compatibility
 *
 * Usage:
 *   MONGODB_URI="your-mongodb-uri" node scripts/migrations/phase1-database-schema.cjs
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + `  ${title}` + colors.reset);
  console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  log('❌ ERROR: MONGODB_URI environment variable is not set', 'red');
  log('   Please set MONGODB_URI in your .env.local file', 'yellow');
  process.exit(1);
}

// Migration statistics
const stats = {
  usersProcessed: 0,
  propertiesProcessed: 0,
  bookingsProcessed: 0,
  errors: []
};

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    log('🔌 Connecting to MongoDB...', 'blue');
    await mongoose.connect(MONGODB_URI);
    log('✅ Connected to MongoDB successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to connect to MongoDB: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Migrate User collection
 * - Ensure all users have the role field properly set
 * - Add ownerProfile field structure (will be null for non-owners)
 */
async function migrateUsers() {
  logSection('MIGRATING USER COLLECTION');

  try {
    const User = mongoose.connection.collection('users');

    // Count total users
    const totalUsers = await User.countDocuments();
    log(`📊 Total users found: ${totalUsers}`, 'cyan');

    // Ensure all users have a valid role
    const updateResult = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null }
        ]
      },
      {
        $set: { role: 'user' }
      }
    );

    stats.usersProcessed = updateResult.modifiedCount;
    log(`✅ Updated ${updateResult.modifiedCount} users with default role`, 'green');

    // Add indexes for new fields (if not exists)
    try {
      await User.createIndex({ 'ownerProfile.kycStatus': 1 });
      await User.createIndex({ 'ownerProfile.propertyIds': 1 });
      await User.createIndex({ 'ownerProfile.gstNumber': 1 }, { sparse: true });
      await User.createIndex({ 'ownerProfile.panNumber': 1 }, { sparse: true });
      log('✅ Created indexes for owner profile fields', 'green');
    } catch (indexError) {
      // Indexes might already exist, that's okay
      log(`⚠️  Some indexes may already exist: ${indexError.message}`, 'yellow');
    }

    log(`\n📈 User Migration Summary:`, 'cyan');
    log(`   - Total users: ${totalUsers}`, 'cyan');
    log(`   - Users updated: ${stats.usersProcessed}`, 'cyan');

    return true;
  } catch (error) {
    log(`❌ Error migrating users: ${error.message}`, 'red');
    stats.errors.push({ collection: 'users', error: error.message });
    return false;
  }
}

/**
 * Migrate Property collection
 * - Add paymentSettings with default values
 * - Add ownerId and ownerStatus fields
 * - Set default values for backward compatibility
 */
async function migrateProperties() {
  logSection('MIGRATING PROPERTY COLLECTION');

  try {
    const Property = mongoose.connection.collection('properties');

    // Count total properties
    const totalProperties = await Property.countDocuments();
    log(`📊 Total properties found: ${totalProperties}`, 'cyan');

    // Update properties that don't have paymentSettings
    const updateResult = await Property.updateMany(
      {
        $or: [
          { 'paymentSettings': { $exists: false } },
          { 'ownerStatus': { $exists: false } }
        ]
      },
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
          'paymentSettings.partialPaymentCancellationPolicy': {
            fullRefundDays: 7,
            partialRefundDays: 3,
            partialRefundPercent: 50,
            noRefundDays: 1
          },
          'ownerStatus': 'active'
        }
      }
    );

    stats.propertiesProcessed = updateResult.modifiedCount;
    log(`✅ Updated ${updateResult.modifiedCount} properties with payment settings`, 'green');

    // Link properties to owners (using hostId as ownerId if not set)
    const ownerLinkResult = await Property.updateMany(
      { ownerId: { $exists: false } },
      [
        {
          $set: {
            ownerId: '$hostId'  // Use hostId as ownerId by default
          }
        }
      ]
    );

    log(`✅ Linked ${ownerLinkResult.modifiedCount} properties to owners`, 'green');

    // Add indexes for new fields
    try {
      await Property.createIndex({ ownerId: 1 });
      await Property.createIndex({ 'paymentSettings.partialPaymentEnabled': 1 });
      await Property.createIndex({ ownerStatus: 1 });
      log('✅ Created indexes for payment settings fields', 'green');
    } catch (indexError) {
      log(`⚠️  Some indexes may already exist: ${indexError.message}`, 'yellow');
    }

    log(`\n📈 Property Migration Summary:`, 'cyan');
    log(`   - Total properties: ${totalProperties}`, 'cyan');
    log(`   - Properties updated: ${stats.propertiesProcessed}`, 'cyan');
    log(`   - Properties linked to owners: ${ownerLinkResult.modifiedCount}`, 'cyan');

    return true;
  } catch (error) {
    log(`❌ Error migrating properties: ${error.message}`, 'red');
    stats.errors.push({ collection: 'properties', error: error.message });
    return false;
  }
}

/**
 * Migrate Booking collection
 * - Add isPartialPayment field (default: false for existing bookings)
 * - Add hotel payment status fields
 * - Add owner payout tracking fields
 */
async function migrateBookings() {
  logSection('MIGRATING BOOKING COLLECTION');

  try {
    const Booking = mongoose.connection.collection('bookings');

    // Count total bookings
    const totalBookings = await Booking.countDocuments();
    log(`📊 Total bookings found: ${totalBookings}`, 'cyan');

    // Update bookings that don't have partial payment fields
    const updateResult = await Booking.updateMany(
      {
        $or: [
          { isPartialPayment: { $exists: false } },
          { hotelPaymentStatus: { $exists: false } },
          { ownerPayoutStatus: { $exists: false } }
        ]
      },
      {
        $set: {
          isPartialPayment: false,
          hotelPaymentStatus: 'pending',
          ownerPayoutStatus: 'pending'
        }
      }
    );

    stats.bookingsProcessed = updateResult.modifiedCount;
    log(`✅ Updated ${updateResult.modifiedCount} bookings with partial payment fields`, 'green');

    // For completed bookings, mark hotel payment as completed
    const completedBookingsUpdate = await Booking.updateMany(
      {
        status: { $in: ['completed', 'refunded'] },
        isPartialPayment: false,
        hotelPaymentStatus: 'pending'
      },
      {
        $set: {
          hotelPaymentStatus: 'completed'
        }
      }
    );

    log(`✅ Marked ${completedBookingsUpdate.modifiedCount} completed bookings as fully paid`, 'green');

    // Add indexes for new fields
    try {
      await Booking.createIndex({ isPartialPayment: 1 });
      await Booking.createIndex({ hotelPaymentStatus: 1 });
      await Booking.createIndex({ ownerPayoutStatus: 1 });
      await Booking.createIndex({ propertyId: 1, hotelPaymentStatus: 1 });
      await Booking.createIndex({ hotelPaymentCollectedBy: 1 });
      log('✅ Created indexes for partial payment fields', 'green');
    } catch (indexError) {
      log(`⚠️  Some indexes may already exist: ${indexError.message}`, 'yellow');
    }

    log(`\n📈 Booking Migration Summary:`, 'cyan');
    log(`   - Total bookings: ${totalBookings}`, 'cyan');
    log(`   - Bookings updated: ${stats.bookingsProcessed}`, 'cyan');
    log(`   - Completed bookings marked: ${completedBookingsUpdate.modifiedCount}`, 'cyan');

    return true;
  } catch (error) {
    log(`❌ Error migrating bookings: ${error.message}`, 'red');
    stats.errors.push({ collection: 'bookings', error: error.message });
    return false;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  logSection('VERIFYING MIGRATION');

  try {
    const User = mongoose.connection.collection('users');
    const Property = mongoose.connection.collection('properties');
    const Booking = mongoose.connection.collection('bookings');

    // Verify users
    const usersWithRole = await User.countDocuments({ role: { $exists: true } });
    const totalUsers = await User.countDocuments();
    log(`✓ Users with role field: ${usersWithRole}/${totalUsers}`, 'green');

    // Verify properties
    const propertiesWithSettings = await Property.countDocuments({
      'paymentSettings': { $exists: true }
    });
    const totalProperties = await Property.countDocuments();
    log(`✓ Properties with payment settings: ${propertiesWithSettings}/${totalProperties}`, 'green');

    const propertiesWithOwner = await Property.countDocuments({
      ownerId: { $exists: true }
    });
    log(`✓ Properties with owner: ${propertiesWithOwner}/${totalProperties}`, 'green');

    // Verify bookings
    const bookingsWithPartialPayment = await Booking.countDocuments({
      isPartialPayment: { $exists: true }
    });
    const totalBookings = await Booking.countDocuments();
    log(`✓ Bookings with partial payment fields: ${bookingsWithPartialPayment}/${totalBookings}`, 'green');

    // Check for any issues
    const usersWithoutRole = totalUsers - usersWithRole;
    const propertiesWithoutSettings = totalProperties - propertiesWithSettings;
    const bookingsWithoutFields = totalBookings - bookingsWithPartialPayment;

    if (usersWithoutRole > 0 || propertiesWithoutSettings > 0 || bookingsWithoutFields > 0) {
      log(`\n⚠️  Migration completed with some issues:`, 'yellow');
      if (usersWithoutRole > 0) {
        log(`   - ${usersWithoutRole} users missing role field`, 'yellow');
      }
      if (propertiesWithoutSettings > 0) {
        log(`   - ${propertiesWithoutSettings} properties missing payment settings`, 'yellow');
      }
      if (bookingsWithoutFields > 0) {
        log(`   - ${bookingsWithoutFields} bookings missing partial payment fields`, 'yellow');
      }
      return false;
    }

    log(`\n✅ All collections migrated successfully!`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error during verification: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Print final summary
 */
function printSummary() {
  logSection('MIGRATION COMPLETE');

  log('📊 Final Statistics:', 'cyan');
  log(`   Users processed: ${stats.usersProcessed}`, 'cyan');
  log(`   Properties processed: ${stats.propertiesProcessed}`, 'cyan');
  log(`   Bookings processed: ${stats.bookingsProcessed}`, 'cyan');

  if (stats.errors.length > 0) {
    log(`\n⚠️  Errors encountered: ${stats.errors.length}`, 'yellow');
    stats.errors.forEach((err, index) => {
      log(`   ${index + 1}. ${err.collection}: ${err.error}`, 'yellow');
    });
  } else {
    log(`\n✅ No errors encountered`, 'green');
  }

  log('\n' + colors.green + '✨ Phase 1 migration completed successfully!' + colors.reset);
  log(colors.cyan + '\nNext steps:' + colors.reset);
  log('  1. Verify your application is working correctly');
  log('  2. Test the new partial payment features');
  log('  3. Check property owner functionality');
  log('  4. Review the migration logs for any warnings\n');
}

/**
 * Main migration function
 */
async function runMigration() {
  const startTime = Date.now();

  log('\n' + colors.cyan + '╔════════════════════════════════════════════════════════╗' + colors.reset);
  log(colors.cyan + '║        PHASE 1 DATABASE MIGRATION                      ║' + colors.reset);
  log(colors.cyan + '║        Owner System & Partial Payments                 ║' + colors.reset);
  log(colors.cyan + '╚════════════════════════════════════════════════════════╝' + colors.reset);
  log(colors.yellow + '\n⚠️  This will modify your database. Ensure you have a backup!' + colors.reset);
  log(colors.cyan + `\nStarting migration at: ${new Date().toLocaleString()}` + colors.reset + '\n');

  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Run migrations
    const usersMigrated = await migrateUsers();
    const propertiesMigrated = await migrateProperties();
    const bookingsMigrated = await migrateBookings();

    // Verify migration
    const verified = await verifyMigration();

    // Calculate duration
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱️  Migration completed in ${duration} seconds`, 'cyan');

    // Print summary
    printSummary();

    // Exit with appropriate code
    if (usersMigrated && propertiesMigrated && bookingsMigrated && verified) {
      process.exit(0);
    } else {
      log('\n⚠️  Migration completed with warnings. Please review the logs.', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    log(`Stack trace: ${error.stack}`, 'red');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from MongoDB', 'blue');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('\n\n⚠️  Migration interrupted by user', 'yellow');
  await mongoose.disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('\n\n⚠️  Migration terminated', 'yellow');
  await mongoose.disconnect();
  process.exit(1);
});

// Run migration
runMigration().catch(async (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  await mongoose.disconnect();
  process.exit(1);
});
