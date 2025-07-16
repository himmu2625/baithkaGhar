import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgent from '@/models/TravelAgent';
import Booking from '@/models/Booking';
import { getSession } from '@/lib/get-session';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    // Find travel agent by user ID or email
    const travelAgent = await TravelAgent.findOne({
      $or: [
        { userId: session.user.id },
        { email: session.user.email }
      ]
    });

    if (!travelAgent) {
      return NextResponse.json(
        { success: false, message: 'Travel agent not found' },
        { status: 404 }
      );
    }

    if (travelAgent.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is not active' },
        { status: 403 }
      );
    }

    // Get recent bookings
    const recentBookings = await Booking.find({ travelAgentId: travelAgent._id })
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get monthly analytics
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthlyBookings = await Booking.find({
      travelAgentId: travelAgent._id,
      dateFrom: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean();

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const monthlyCommission = monthlyBookings.reduce((sum, booking) => sum + (booking.travelAgentCommissionAmount || 0), 0);

    // Get yearly analytics
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const yearlyBookings = await Booking.find({
      travelAgentId: travelAgent._id,
      dateFrom: { $gte: startOfYear }
    }).lean();

    const yearlyRevenue = yearlyBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const yearlyCommission = yearlyBookings.reduce((sum, booking) => sum + (booking.travelAgentCommissionAmount || 0), 0);

    // Calculate commission rate based on structure
    let commissionRate = 0;
    if (travelAgent.commissionStructure.type === 'percentage') {
      commissionRate = travelAgent.commissionStructure.rate;
    } else if (travelAgent.commissionStructure.type === 'fixed') {
      commissionRate = travelAgent.commissionStructure.rate;
    }

    const dashboardData = {
      agent: {
        id: travelAgent._id.toString(),
        name: travelAgent.name,
        companyName: travelAgent.companyName,
        referralCode: travelAgent.formattedReferralCode,
        commissionDisplay: travelAgent.commissionDisplay,
        walletBalance: travelAgent.walletBalance,
        totalEarnings: travelAgent.totalEarnings,
        totalBookings: travelAgent.totalBookings,
        totalRevenue: travelAgent.totalRevenue,
        totalClients: travelAgent.totalClients,
        averageBookingValue: travelAgent.averageBookingValue,
        status: travelAgent.status,
        joinedAt: travelAgent.joinedAt,
        lastActiveAt: travelAgent.lastActiveAt
      },
      analytics: {
        monthly: {
          bookings: monthlyBookings.length,
          revenue: monthlyRevenue,
          commission: monthlyCommission
        },
        yearly: {
          bookings: yearlyBookings.length,
          revenue: yearlyRevenue,
          commission: yearlyCommission
        },
        total: {
          bookings: travelAgent.totalBookings,
          revenue: travelAgent.totalRevenue,
          earnings: travelAgent.totalEarnings,
          clients: travelAgent.totalClients
        }
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        propertyName: booking.propertyName || booking.propertyId?.title || 'Unknown Property',
        dateFrom: booking.dateFrom,
        dateTo: booking.dateTo,
        totalPrice: booking.totalPrice,
        commissionAmount: booking.travelAgentCommissionAmount,
        status: booking.status,
        createdAt: booking.createdAt
      })),
      preferences: travelAgent.preferences,
      commissionStructure: travelAgent.commissionStructure
    };

    return NextResponse.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error: any) {
    console.error('Travel agent dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
} 