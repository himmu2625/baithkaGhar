/**
 * Migration Script: Add Payment History to Existing Bookings
 *
 * This script:
 * 1. Finds all bookings with completed payments but no payment history
 * 2. Creates payment history entries based on existing payment data
 * 3. Safely updates bookings without breaking existing data
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithaka-ghar';

// Define minimal Booking schema for migration
const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

async function migratePaymentHistory() {
  try {
    console.log('🔄 Starting payment history migration...');
    console.log('📊 Connecting to database:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Find bookings with payments but no payment history
    const bookingsToMigrate = await Booking.find({
      $or: [
        { paymentHistory: { $exists: false } },
        { paymentHistory: { $size: 0 } }
      ],
      $and: [
        {
          $or: [
            { paymentStatus: 'completed', onlinePaymentAmount: { $gt: 0 } },
            { hotelPaymentStatus: 'collected', hotelPaymentAmount: { $gt: 0 } }
          ]
        }
      ]
    }).lean();

    console.log(`\n📋 Found ${bookingsToMigrate.length} bookings to migrate`);

    if (bookingsToMigrate.length === 0) {
      console.log('✅ No bookings need migration');
      await mongoose.disconnect();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const booking of bookingsToMigrate) {
      try {
        const paymentHistory = [];

        // Add online payment to history if it exists
        if (booking.paymentStatus === 'completed' && booking.onlinePaymentAmount > 0) {
          paymentHistory.push({
            amount: booking.onlinePaymentAmount,
            paymentType: 'online',
            method: 'razorpay',
            status: 'completed',
            transactionId: booking.paymentId || undefined,
            collectedAt: booking.updatedAt || booking.createdAt || new Date(),
            notes: 'Online payment via Razorpay (migrated)'
          });
        }

        // Add hotel payment to history if it's collected
        if (booking.hotelPaymentStatus === 'collected' && booking.hotelPaymentAmount > 0) {
          paymentHistory.push({
            amount: booking.hotelPaymentAmount,
            paymentType: 'hotel',
            method: booking.hotelPaymentMethod || 'cash',
            status: 'completed',
            transactionId: booking.hotelPaymentId || undefined,
            collectedBy: booking.hotelPaymentCollectedBy || undefined,
            collectedAt: booking.hotelPaymentCompletedAt || booking.updatedAt || new Date(),
            notes: 'Payment collected at property (migrated)'
          });
        }

        // Update booking with payment history
        if (paymentHistory.length > 0) {
          await Booking.updateOne(
            { _id: booking._id },
            { $set: { paymentHistory } }
          );
          migratedCount++;

          console.log(`✅ Migrated booking ${booking._id}: ${paymentHistory.length} payment(s)`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating booking ${booking._id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total bookings found: ${bookingsToMigrate.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Verify migration
    const verifyCount = await Booking.countDocuments({
      paymentHistory: { $exists: true, $ne: [] }
    });
    console.log(`\n✅ Verification: ${verifyCount} bookings now have payment history`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePaymentHistory();
