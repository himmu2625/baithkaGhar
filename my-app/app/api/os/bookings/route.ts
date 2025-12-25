import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(session.user.id!);

    // Build query
    const query: any = {
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds }
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch bookings
    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title location address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Booking.countDocuments(query);

    // Calculate statistics
    const stats = {
      total: totalCount,
      confirmed: await Booking.countDocuments({ ...query, status: 'confirmed' }),
      pending: await Booking.countDocuments({ ...query, status: 'pending' }),
      completed: await Booking.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...query, status: 'cancelled' }),
    };

    return NextResponse.json({
      bookings,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
