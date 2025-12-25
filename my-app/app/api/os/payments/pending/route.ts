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
    const propertyId = searchParams.get('propertyId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    const query: any = {
      isPartialPayment: true,
      hotelPaymentStatus: 'pending',
      status: { $in: ['confirmed', 'pending'] },
      propertyId: propertyIds.includes('*')
        ? { $exists: true }
        : { $in: propertyIds.map(id => id) }
    };

    // Filter by specific property if provided
    if (propertyId && propertyId !== 'all') {
      query.propertyId = propertyId;
    }

    // Filter by date range if provided
    if (dateFrom) {
      query.dateFrom = { $gte: new Date(dateFrom) };
    }
    if (dateTo) {
      query.dateFrom = { ...query.dateFrom, $lte: new Date(dateTo) };
    }

    // Fetch pending payments
    const pendingPayments = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title location address')
      .sort({ dateFrom: 1 }) // Sort by check-in date (earliest first)
      .lean();

    // Calculate additional data for each payment
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enhancedPayments = pendingPayments.map((booking) => {
      const checkInDate = new Date(booking.dateFrom);
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        bookingId: booking._id,
        guestName: booking.userId?.name || 'Unknown Guest',
        guestEmail: booking.userId?.email || '',
        guestPhone: booking.userId?.phone || '',
        propertyTitle: booking.propertyId?.title || 'Unknown Property',
        propertyLocation: booking.propertyId?.location || '',
        checkInDate: booking.dateFrom,
        checkOutDate: booking.dateTo,
        amountPending: booking.hotelPaymentAmount || 0,
        totalAmount: booking.totalAmount || 0,
        onlinePaymentAmount: booking.onlinePaymentAmount || 0,
        daysUntilCheckIn,
        status: booking.status,
        createdAt: booking.createdAt,
      };
    });

    // Calculate summary statistics
    const totalPending = enhancedPayments.reduce(
      (sum, payment) => sum + payment.amountPending,
      0
    );

    const dueToday = enhancedPayments.filter(
      (payment) => payment.daysUntilCheckIn === 0
    );

    const dueThisWeek = enhancedPayments.filter(
      (payment) => payment.daysUntilCheckIn >= 0 && payment.daysUntilCheckIn <= 7
    );

    // Get recently collected payments (last 10)
    const recentlyCollectedQuery: any = {
      isPartialPayment: true,
      hotelPaymentStatus: 'collected',
      propertyId: propertyIds.includes('*')
        ? { $exists: true }
        : { $in: propertyIds.map(id => id) }
    };

    const recentlyCollected = await Booking.find(recentlyCollectedQuery)
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .populate('hotelPaymentCollectedBy', 'name')
      .sort({ hotelPaymentDate: -1 })
      .limit(10)
      .lean();

    const enhancedRecentlyCollected = recentlyCollected.map((booking) => ({
      bookingId: booking._id,
      guestName: booking.userId?.name || 'Unknown Guest',
      propertyTitle: booking.propertyId?.title || 'Unknown Property',
      amount: booking.hotelPaymentAmount || 0,
      method: booking.hotelPaymentMethod || 'cash',
      collectedDate: booking.hotelPaymentDate,
      collectedBy: booking.hotelPaymentCollectedBy?.name || 'Staff',
    }));

    // Calculate this month's collected amount
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthCollectedAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*')
            ? { $exists: true }
            : { $in: propertyIds.map(id => id) },
          isPartialPayment: true,
          hotelPaymentStatus: 'collected',
          hotelPaymentDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$hotelPaymentAmount' }
        }
      }
    ]);

    const thisMonthCollected = thisMonthCollectedAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      pendingPayments: enhancedPayments,
      stats: {
        totalPending,
        totalPendingCount: enhancedPayments.length,
        dueToday: dueToday.length,
        dueTodayAmount: dueToday.reduce((sum, p) => sum + p.amountPending, 0),
        dueThisWeek: dueThisWeek.length,
        dueThisWeekAmount: dueThisWeek.reduce((sum, p) => sum + p.amountPending, 0),
        thisMonthCollected,
      },
      recentlyCollected: enhancedRecentlyCollected,
    });

  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}
