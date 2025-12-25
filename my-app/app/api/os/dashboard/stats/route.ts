import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getOwnerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(session.user.id!);

    // Handle super_admin and admin who can see all properties
    const propertyFilter = propertyIds.includes('*')
      ? {} // No filter - show all properties
      : { _id: { $in: propertyIds } };

    // Calculate statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total Properties
    const totalProperties = await Property.countDocuments({
      ...propertyFilter,
      status: { $ne: 'deleted' }
    });

    // Active Bookings (confirmed bookings with future check-out dates)
    const activeBookings = await Booking.countDocuments({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds },
      status: { $in: ['confirmed', 'pending'] },
      dateTo: { $gte: now }
    });

    // Pending Hotel Payments (partial payments with hotel payment pending)
    const pendingPaymentsAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
          isPartialPayment: true,
          hotelPaymentStatus: 'pending',
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$hotelPaymentAmount' }
        }
      }
    ]);

    const pendingPayments = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].total : 0;

    // This Month's Revenue (completed bookings this month)
    const thisMonthRevenueAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
          status: { $in: ['completed', 'confirmed'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    const thisMonthRevenue = thisMonthRevenueAgg.length > 0 ? thisMonthRevenueAgg[0].total : 0;

    // Last Month's Revenue (for comparison)
    const lastMonthRevenueAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
          status: { $in: ['completed', 'confirmed'] },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    const lastMonthRevenue = lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;

    // Calculate percentage change
    const revenueChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    // Upcoming Check-ins (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingCheckins = await Booking.countDocuments({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds },
      status: 'confirmed',
      dateFrom: { $gte: now, $lte: sevenDaysFromNow }
    });

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds }
    })
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id userId propertyId status dateFrom dateTo totalPrice createdAt')
      .lean();

    // Return statistics
    return NextResponse.json({
      totalProperties,
      activeBookings,
      pendingPayments,
      thisMonthRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10, // Round to 1 decimal
      upcomingCheckins,
      recentBookings,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
