import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';

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
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query to find guests who have bookings with owner's properties
    const bookingQuery: any = {
      propertyId: propertyIds.includes('*')
        ? { $exists: true }
        : { $in: propertyIds.map(id => id) }
    };

    // Get unique user IDs from bookings
    const bookings = await Booking.find(bookingQuery)
      .distinct('userId')
      .lean();

    const userIds = bookings;

    // Build user query with search
    const userQuery: any = {
      _id: { $in: userIds },
      role: 'customer'
    };

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users with pagination
    const total = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select('name email phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhance each user with booking statistics
    const guestsWithStats = await Promise.all(
      users.map(async (user) => {
        // Get all bookings for this guest
        const guestBookings = await Booking.find({
          userId: user._id,
          propertyId: propertyIds.includes('*')
            ? { $exists: true }
            : { $in: propertyIds.map(id => id) }
        })
        .sort({ createdAt: -1 })
        .lean();

        const totalBookings = guestBookings.length;

        // Calculate total spent
        const totalSpent = guestBookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0
        );

        // Get last visit (most recent checkout date)
        const lastVisit = guestBookings.length > 0
          ? guestBookings[0].dateTo
          : null;

        // Count completed bookings
        const completedBookings = guestBookings.filter(
          b => b.status === 'completed'
        ).length;

        // Get most used payment method
        const paymentMethods = guestBookings
          .map(b => b.paymentMethod)
          .filter(Boolean);

        const paymentMethodCounts: any = {};
        paymentMethods.forEach(method => {
          paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
        });

        const preferredPaymentMethod = Object.keys(paymentMethodCounts).length > 0
          ? Object.keys(paymentMethodCounts).reduce((a, b) =>
              paymentMethodCounts[a] > paymentMethodCounts[b] ? a : b
            )
          : 'unknown';

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          joinedDate: user.createdAt,
          totalBookings,
          completedBookings,
          totalSpent,
          lastVisit,
          preferredPaymentMethod,
          status: totalBookings > 0 ? 'active' : 'inactive'
        };
      })
    );

    // Calculate summary statistics
    const totalGuests = guestsWithStats.length;
    const activeGuests = guestsWithStats.filter(g => g.status === 'active').length;
    const totalRevenue = guestsWithStats.reduce((sum, g) => sum + g.totalSpent, 0);

    // Get new guests this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = guestsWithStats.filter(
      g => new Date(g.joinedDate) >= startOfMonth
    ).length;

    // Get returning guests (more than 1 booking)
    const returningGuests = guestsWithStats.filter(
      g => g.totalBookings > 1
    ).length;

    return NextResponse.json({
      success: true,
      guests: guestsWithStats,
      stats: {
        total: totalGuests,
        active: activeGuests,
        newThisMonth,
        returningGuests,
        totalRevenue
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}
