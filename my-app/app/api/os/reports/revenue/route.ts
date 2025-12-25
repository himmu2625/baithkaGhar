import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const propertyId = searchParams.get('propertyId');

    // Set default date range (last 30 days)
    const endDate = toDate ? new Date(toDate) : new Date();
    const startDate = fromDate ? new Date(fromDate) : new Date(endDate);
    if (!fromDate) {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Build query
    const query: any = {
      status: { $in: ['confirmed', 'completed'] },
      createdAt: { $gte: startDate, $lte: endDate },
      propertyId: propertyIds.includes('*')
        ? { $exists: true }
        : { $in: propertyIds.map(id => id) }
    };

    // Filter by specific property if provided
    if (propertyId && propertyId !== 'all') {
      query.propertyId = propertyId;
    }

    // Calculate total revenue
    const revenueAgg = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          onlineRevenue: { $sum: '$onlinePaymentAmount' },
          hotelRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$hotelPaymentStatus', 'collected'] },
                '$hotelPaymentAmount',
                0
              ]
            }
          },
          pendingRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$hotelPaymentStatus', 'pending'] },
                '$hotelPaymentAmount',
                0
              ]
            }
          },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const summary = revenueAgg[0] || {
      totalRevenue: 0,
      onlineRevenue: 0,
      hotelRevenue: 0,
      pendingRevenue: 0,
      totalBookings: 0
    };

    // Calculate daily revenue
    const dailyRevenue = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          amount: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate revenue by property
    const revenueByProperty = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$propertyId',
          amount: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      {
        $project: {
          propertyId: '$_id',
          propertyTitle: { $arrayElemAt: ['$property.title', 0] },
          amount: 1,
          bookings: 1
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Calculate growth (compare with previous period)
    const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodLength);

    const previousQuery = {
      ...query,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    };

    const previousRevenueAgg = await Booking.aggregate([
      { $match: previousQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const previousRevenue = previousRevenueAgg[0]?.totalRevenue || 0;
    const growth = previousRevenue > 0
      ? ((summary.totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        growth: Math.round(growth * 10) / 10,
        averageBookingValue: summary.totalBookings > 0
          ? Math.round(summary.totalRevenue / summary.totalBookings)
          : 0
      },
      daily: dailyRevenue.map((d) => ({
        date: d._id,
        amount: d.amount,
        bookings: d.bookings
      })),
      byProperty: revenueByProperty.map((p) => ({
        propertyId: p.propertyId,
        propertyTitle: p.propertyTitle || 'Unknown Property',
        amount: p.amount,
        bookings: p.bookings
      })),
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
