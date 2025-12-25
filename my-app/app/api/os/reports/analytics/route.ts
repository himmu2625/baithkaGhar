import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Room from '@/models/Room';

// GET /api/os/reports/analytics - Get comprehensive analytics data
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const propertyId = searchParams.get('propertyId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Build query filter
    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const bookingQuery: any = {
      dateFrom: dateFilter,
    };

    // If propertyId is provided, filter by property
    if (propertyId) {
      bookingQuery.propertyId = propertyId;

      // Verify user has access to this property
      const property = await Property.findOne({
        _id: propertyId,
        ownerId: session.user.id,
      });

      if (!property) {
        return NextResponse.json(
          { error: 'Unauthorized - Property not found or access denied' },
          { status: 403 }
        );
      }
    } else {
      // Get all properties owned by this user
      const userProperties = await Property.find({
        ownerId: session.user.id,
      }).select('_id');

      const propertyIds = userProperties.map(p => p._id);
      bookingQuery.propertyId = { $in: propertyIds };
    }

    // Fetch all bookings in the date range
    const bookings = await Booking.find(bookingQuery).lean();

    // Generate date array for the range
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize data structures
    const revenueByDate: Record<string, { onlinePayment: number; hotelPayment: number; total: number }> = {};
    const bookingsByDate: Record<string, { confirmed: number; pending: number; cancelled: number; completed: number }> = {};

    dates.forEach(date => {
      revenueByDate[date] = { onlinePayment: 0, hotelPayment: 0, total: 0 };
      bookingsByDate[date] = { confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
    });

    // Aggregate revenue and bookings data
    let totalOnlinePayment = 0;
    let totalHotelPayment = 0;
    let totalPending = 0;

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.dateFrom).toISOString().split('T')[0];

      if (revenueByDate[bookingDate]) {
        // Revenue data
        if (booking.onlinePaymentStatus === 'paid') {
          revenueByDate[bookingDate].onlinePayment += booking.onlinePayment || 0;
          totalOnlinePayment += booking.onlinePayment || 0;
        }

        if (booking.hotelPaymentStatus === 'collected') {
          revenueByDate[bookingDate].hotelPayment += booking.hotelPayment || 0;
          totalHotelPayment += booking.hotelPayment || 0;
        }

        if (booking.status === 'confirmed' && booking.hotelPaymentStatus === 'pending') {
          totalPending += booking.hotelPayment || 0;
        }

        revenueByDate[bookingDate].total =
          revenueByDate[bookingDate].onlinePayment +
          revenueByDate[bookingDate].hotelPayment;

        // Bookings by status
        if (booking.status === 'confirmed') {
          bookingsByDate[bookingDate].confirmed += 1;
        } else if (booking.status === 'pending') {
          bookingsByDate[bookingDate].pending += 1;
        } else if (booking.status === 'cancelled') {
          bookingsByDate[bookingDate].cancelled += 1;
        } else if (booking.status === 'completed') {
          bookingsByDate[bookingDate].completed += 1;
        }
      }
    });

    // Calculate occupancy data
    const occupancyByDate: Record<string, { occupancyRate: number; occupiedRooms: number; totalRooms: number }> = {};

    // Get total rooms count
    let totalRoomsQuery: any = { isActive: true, isBookable: true };
    if (propertyId) {
      totalRoomsQuery.propertyId = propertyId;
    } else {
      const userProperties = await Property.find({ ownerId: session.user.id }).select('_id');
      totalRoomsQuery.propertyId = { $in: userProperties.map(p => p._id) };
    }

    const totalRooms = await Room.countDocuments(totalRoomsQuery);

    dates.forEach(date => {
      // Count occupied rooms for this date
      const occupiedRooms = bookings.filter(booking => {
        const checkIn = new Date(booking.dateFrom);
        const checkOut = new Date(booking.dateTo);
        const current = new Date(date);

        return (
          (booking.status === 'confirmed' || booking.status === 'completed') &&
          current >= checkIn &&
          current <= checkOut
        );
      }).length;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      occupancyByDate[date] = {
        occupancyRate,
        occupiedRooms,
        totalRooms,
      };
    });

    // Format data for charts
    const revenueData = dates.map(date => ({
      date,
      ...revenueByDate[date],
    }));

    const bookingsData = dates.map(date => ({
      date,
      ...bookingsByDate[date],
    }));

    const occupancyData = dates.map(date => ({
      date,
      ...occupancyByDate[date],
    }));

    const paymentDistribution = {
      onlinePayment: totalOnlinePayment,
      hotelPayment: totalHotelPayment,
      pending: totalPending,
    };

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenueData,
        bookings: bookingsData,
        occupancy: occupancyData,
        paymentDistribution,
      },
      metadata: {
        startDate,
        endDate,
        propertyId: propertyId || 'all',
        totalBookings: bookings.length,
        totalRevenue: totalOnlinePayment + totalHotelPayment,
        totalRooms,
      },
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
