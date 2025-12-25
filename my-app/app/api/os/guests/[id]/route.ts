import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch user
    const user = await User.findById(params.id)
      .select('name email phone createdAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Get all bookings for this guest with owner's properties
    const bookings = await Booking.find({
      userId: params.id,
      propertyId: propertyIds.includes('*')
        ? { $exists: true }
        : { $in: propertyIds.map(id => id) }
    })
    .populate('propertyId', 'title location images')
    .sort({ createdAt: -1 })
    .lean();

    // Verify guest has bookings with owner's properties
    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - This guest has no bookings with your properties' },
        { status: 403 }
      );
    }

    // Calculate statistics
    const totalBookings = bookings.length;

    const totalSpent = bookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0
    );

    const completedBookings = bookings.filter(
      b => b.status === 'completed'
    ).length;

    const cancelledBookings = bookings.filter(
      b => b.status === 'cancelled'
    ).length;

    // Calculate average stay duration
    const stayDurations = bookings.map(b => {
      const checkIn = new Date(b.dateFrom);
      const checkOut = new Date(b.dateTo);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgStayDuration = stayDurations.length > 0
      ? Math.round(stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length)
      : 0;

    // Get payment method distribution
    const paymentMethods = bookings
      .map(b => b.paymentMethod)
      .filter(Boolean);

    const paymentMethodCounts: any = {};
    paymentMethods.forEach(method => {
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
    });

    // Get special requests
    const specialRequests = bookings
      .map(b => b.specialRequests)
      .filter(Boolean);

    // Get last visit
    const lastVisit = bookings.length > 0 ? bookings[0].dateTo : null;

    // Get first visit
    const firstVisit = bookings.length > 0
      ? bookings[bookings.length - 1].dateFrom
      : null;

    // Calculate revenue by year
    const revenueByYear: any = {};
    bookings.forEach(booking => {
      const year = new Date(booking.createdAt).getFullYear();
      revenueByYear[year] = (revenueByYear[year] || 0) + (booking.totalAmount || 0);
    });

    // Get properties visited
    const propertiesVisited = [...new Set(bookings.map(b => b.propertyId?._id?.toString()))].length;

    // Calculate booking frequency (bookings per month since first booking)
    const monthsSinceFirst = firstVisit
      ? Math.max(1, Math.ceil((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 1;

    const bookingFrequency = totalBookings / monthsSinceFirst;

    return NextResponse.json({
      success: true,
      guest: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        joinedDate: user.createdAt,
        firstVisit,
        lastVisit
      },
      stats: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent,
        avgStayDuration,
        propertiesVisited,
        bookingFrequency: Math.round(bookingFrequency * 100) / 100,
        paymentMethodDistribution: paymentMethodCounts,
        revenueByYear
      },
      bookings: bookings.map(b => ({
        _id: b._id,
        propertyId: b.propertyId?._id,
        propertyTitle: b.propertyId?.title || 'Unknown Property',
        propertyImage: b.propertyId?.images?.[0] || null,
        dateFrom: b.dateFrom,
        dateTo: b.dateTo,
        totalAmount: b.totalAmount,
        status: b.status,
        isPartialPayment: b.isPartialPayment,
        hotelPaymentStatus: b.hotelPaymentStatus,
        paymentMethod: b.paymentMethod,
        specialRequests: b.specialRequests,
        createdAt: b.createdAt
      })),
      specialRequests: specialRequests.slice(0, 5) // Last 5 special requests
    });

  } catch (error) {
    console.error('Error fetching guest details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest details' },
      { status: 500 }
    );
  }
}
