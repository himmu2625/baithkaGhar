import dbConnect from "@/lib/db/dbConnect";
import Influencer from "@/models/Influencer";
import ReferralClick from "@/models/ReferralClick";
import Booking from "@/models/Booking";
import mongoose from "mongoose";

export interface InfluencerCommissionData {
  influencerId: mongoose.Types.ObjectId;
  referralCode: string;
  commissionAmount: number;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
}

export class InfluencerService {
  /**
   * Check if there's an active referral session and return commission data
   */
  static async checkReferralSession(cookies: any): Promise<InfluencerCommissionData | null> {
    try {
      await dbConnect();

      // Check for referral code in cookies
      const referralCode = cookies.get('influencer_ref')?.value;
      const referralTime = cookies.get('influencer_ref_time')?.value;

      if (!referralCode || !referralTime) {
        return null;
      }

      // Check if referral is still valid (within 30 days)
      const referralTimestamp = parseInt(referralTime);
      const now = Date.now();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (now - referralTimestamp > thirtyDaysInMs) {
        return null;
      }

      // Find the influencer
      const influencer = await Influencer.findOne({
        referralCode: referralCode.toUpperCase(),
        status: 'active'
      });

      if (!influencer) {
        return null;
      }

      return {
        influencerId: influencer._id,
        referralCode: influencer.referralCode,
        commissionAmount: 0, // Will be calculated based on booking amount
        commissionRate: influencer.commissionRate,
        commissionType: influencer.commissionType
      };

    } catch (error) {
      console.error("Error checking referral session:", error);
      return null;
    }
  }

  /**
   * Calculate commission amount for a booking
   */
  static calculateCommission(
    bookingAmount: number,
    commissionRate: number,
    commissionType: 'percentage' | 'fixed'
  ): number {
    if (commissionType === 'percentage') {
      return (bookingAmount * commissionRate) / 100;
    } else {
      return commissionRate; // Fixed amount
    }
  }

  /**
   * Apply influencer commission to a booking
   */
  static async applyCommissionToBooking(
    bookingId: mongoose.Types.ObjectId,
    bookingAmount: number,
    referralData: InfluencerCommissionData,
    sessionId?: string
  ): Promise<void> {
    try {
      await dbConnect();

      // Calculate commission amount
      const commissionAmount = this.calculateCommission(
        bookingAmount,
        referralData.commissionRate,
        referralData.commissionType
      );

      if (commissionAmount <= 0) {
        return;
      }

      // Update the booking with influencer information
      await Booking.findByIdAndUpdate(bookingId, {
        influencerId: referralData.influencerId,
        referralCode: referralData.referralCode,
        commissionAmount: commissionAmount,
        commissionRate: referralData.commissionRate,
        commissionType: referralData.commissionType,
        commissionPaid: false
      });

      // Update influencer stats
      await Influencer.findByIdAndUpdate(referralData.influencerId, {
        $inc: {
          totalBookings: 1,
          totalRevenue: bookingAmount,
          walletBalance: 0 // Commission will be added when payout is processed
        },
        lastActiveAt: new Date()
      });

      // Mark referral click as converted if we have a session ID
      if (sessionId) {
        await ReferralClick.findOneAndUpdate(
          {
            influencerId: referralData.influencerId,
            sessionId: sessionId,
            conversionStatus: { $ne: 'booked' }
          },
          {
            conversionStatus: 'booked',
            convertedBookingId: bookingId,
            convertedAt: new Date()
          }
        );
      }

      console.log(`Applied commission of ₹${commissionAmount} to booking ${bookingId} for influencer ${referralData.referralCode}`);

    } catch (error) {
      console.error("Error applying commission to booking:", error);
      throw error;
    }
  }

  /**
   * Get unpaid commission amount for an influencer
   */
  static async getUnpaidCommissions(
    influencerId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalAmount: number;
    bookingCount: number;
    bookings: any[];
  }> {
    try {
      await dbConnect();

      const filter: any = {
        influencerId: influencerId,
        commissionPaid: false,
        status: { $in: ['confirmed', 'completed'] }
      };

      if (startDate && endDate) {
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }

      const unpaidBookings = await Booking.find(filter)
        .populate('propertyId', 'name location')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

      const totalAmount = unpaidBookings.reduce((sum, booking) => {
        return sum + (booking.commissionAmount || 0);
      }, 0);

      return {
        totalAmount,
        bookingCount: unpaidBookings.length,
        bookings: unpaidBookings
      };

    } catch (error) {
      console.error("Error getting unpaid commissions:", error);
      throw error;
    }
  }

  /**
   * Get influencer performance metrics
   */
  static async getInfluencerMetrics(
    influencerId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalClicks: number;
    totalBookings: number;
    totalRevenue: number;
    totalCommissions: number;
    conversionRate: number;
    avgOrderValue: number;
    topPerformingDays: any[];
  }> {
    try {
      await dbConnect();

      const dateFilter = startDate && endDate ? {
        $gte: startDate,
        $lte: endDate
      } : {};

      // Get click metrics
      const clickMetrics = await ReferralClick.aggregate([
        {
          $match: {
            influencerId: new mongoose.Types.ObjectId(influencerId),
            ...(startDate && endDate && { clickedAt: dateFilter })
          }
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            conversions: {
              $sum: {
                $cond: [{ $eq: ["$conversionStatus", "booked"] }, 1, 0]
              }
            }
          }
        }
      ]);

      // Get booking metrics
      const bookingMetrics = await Booking.aggregate([
        {
          $match: {
            influencerId: new mongoose.Types.ObjectId(influencerId),
            ...(startDate && endDate && { createdAt: dateFilter })
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" },
            totalCommissions: { $sum: "$commissionAmount" },
            avgOrderValue: { $avg: "$totalPrice" }
          }
        }
      ]);

      // Get daily performance
      const dailyPerformance = await Booking.aggregate([
        {
          $match: {
            influencerId: new mongoose.Types.ObjectId(influencerId),
            ...(startDate && endDate && { createdAt: dateFilter })
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            commissions: { $sum: "$commissionAmount" }
          }
        },
        { $sort: { "_id": -1 } },
        { $limit: 30 }
      ]);

      const clicks = clickMetrics[0] || { totalClicks: 0, conversions: 0 };
      const bookings = bookingMetrics[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        totalCommissions: 0,
        avgOrderValue: 0
      };

      const conversionRate = clicks.totalClicks > 0 
        ? (clicks.conversions / clicks.totalClicks) * 100 
        : 0;

      return {
        totalClicks: clicks.totalClicks,
        totalBookings: bookings.totalBookings,
        totalRevenue: bookings.totalRevenue || 0,
        totalCommissions: bookings.totalCommissions || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: Math.round(bookings.avgOrderValue || 0),
        topPerformingDays: dailyPerformance
      };

    } catch (error) {
      console.error("Error getting influencer metrics:", error);
      throw error;
    }
  }

  /**
   * Clean up expired referral cookies
   */
  static isReferralExpired(referralTime: string): boolean {
    const referralTimestamp = parseInt(referralTime);
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    return now - referralTimestamp > thirtyDaysInMs;
  }
} 