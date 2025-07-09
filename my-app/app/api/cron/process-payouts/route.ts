import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import Influencer from "@/models/Influencer";
import Booking from "@/models/Booking";
import Payout from "@/models/Payout";
import { InfluencerService } from "@/lib/services/influencer-service";

// This endpoint should be called by a cron service (like Vercel Cron, GitHub Actions, or external cron)
// Security: Add authorization header check in production
export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization (add your secret token)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    console.log('[Cron] Starting automated payout processing...');

    // Get current date and calculate previous month period
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    console.log(`[Cron] Processing payouts for period: ${lastMonth.toISOString()} to ${endOfLastMonth.toISOString()}`);

    // Find all active influencers
    const activeInfluencers = await Influencer.find({ 
      status: 'active'
    }).lean();

    console.log(`[Cron] Found ${activeInfluencers.length} active influencers`);

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      totalAmount: 0
    };

    for (const influencer of activeInfluencers) {
      try {
        results.processed++;

        // Check if payout already exists for this period
        const existingPayout = await Payout.findOne({
          influencerId: influencer._id,
          periodStart: { $gte: lastMonth },
          periodEnd: { $lte: endOfLastMonth }
        });

        if (existingPayout) {
          console.log(`[Cron] Payout already exists for influencer ${influencer.referralCode}`);
          results.skipped++;
          continue;
        }

        // Get unpaid commissions for this influencer in the period
        const unpaidData = await InfluencerService.getUnpaidCommissions(
          influencer._id,
          lastMonth,
          endOfLastMonth
        );

        if (unpaidData.totalAmount <= 0 || unpaidData.bookingCount === 0) {
          console.log(`[Cron] No unpaid commissions for influencer ${influencer.referralCode}`);
          results.skipped++;
          continue;
        }

        // Minimum payout threshold (₹100)
        const MIN_PAYOUT_AMOUNT = 100;
        if (unpaidData.totalAmount < MIN_PAYOUT_AMOUNT) {
          console.log(`[Cron] Commission amount ₹${unpaidData.totalAmount} below minimum threshold for ${influencer.referralCode}`);
          results.skipped++;
          continue;
        }

        // Calculate tax deductions (10% TDS for influencers)
        const tdsRate = 0.10; // 10% TDS
        const tdsAmount = unpaidData.totalAmount * tdsRate;

        // Create payout
        const payout = await Payout.createForInfluencer(
          influencer._id,
          lastMonth,
          endOfLastMonth,
          unpaidData.bookings.map(b => b._id),
          unpaidData.totalAmount,
          {
            taxDeductions: { tds: tdsAmount, gst: 0, other: 0 },
            notes: `Auto-generated monthly payout for ${lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          }
        );

        console.log(`[Cron] Created payout ${payout._id} for influencer ${influencer.referralCode}: ₹${unpaidData.totalAmount}`);
        
        results.created++;
        results.totalAmount += unpaidData.totalAmount;

        // Optional: Send email notification to influencer
        // await sendPayoutNotificationEmail(influencer, payout);

      } catch (error) {
        console.error(`[Cron] Error processing influencer ${influencer.referralCode}:`, error);
        results.errors++;
      }
    }

    console.log('[Cron] Payout processing completed:', results);

    // Optional: Send admin notification
    if (results.created > 0) {
      // await sendAdminPayoutSummary(results);
    }

    return NextResponse.json({
      success: true,
      message: 'Automated payout processing completed',
      results,
      period: {
        start: lastMonth.toISOString(),
        end: endOfLastMonth.toISOString()
      }
    });

  } catch (error) {
    console.error('[Cron] Error in automated payout processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Automated payout processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  try {
    // Simple health check and stats
    await dbConnect();

    const stats = await Promise.all([
      Influencer.countDocuments({ status: 'active' }),
      Payout.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ commissionPaid: false, influencerId: { $exists: true } })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Cron job endpoint is active',
      stats: {
        activeInfluencers: stats[0],
        pendingPayouts: stats[1],
        unpaidCommissions: stats[2]
      },
      nextRun: 'This endpoint should be called monthly via cron'
    });

  } catch (error) {
    console.error('Error in cron endpoint health check:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
} 