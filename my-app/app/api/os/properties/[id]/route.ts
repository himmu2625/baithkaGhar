import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

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

    // Fetch property
    const property = await Property.findById(params.id).lean();

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Authorization check
    const hasAccess = await canAccessProperty(session.user.id!, params.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this property' },
        { status: 403 }
      );
    }

    // Calculate statistics
    const totalBookings = await Booking.countDocuments({
      propertyId: params.id
    });

    const activeBookings = await Booking.countDocuments({
      propertyId: params.id,
      status: { $in: ['confirmed', 'pending'] },
      dateTo: { $gte: new Date() }
    });

    // Calculate total revenue
    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: property._id,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    // Calculate occupancy rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookedNights = await Booking.aggregate([
      {
        $match: {
          propertyId: property._id,
          status: { $in: ['confirmed', 'completed'] },
          dateFrom: { $gte: thirtyDaysAgo }
        }
      },
      {
        $project: {
          nights: {
            $divide: [
              { $subtract: ['$dateTo', '$dateFrom'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalNights: { $sum: '$nights' }
        }
      }
    ]);

    const totalBookedNights = bookedNights[0]?.totalNights || 0;
    const availableNights = 30; // Simplified: assuming 1 unit
    const occupancyRate = availableNights > 0
      ? Math.round((totalBookedNights / availableNights) * 100)
      : 0;

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find({
      propertyId: params.id
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate average rating (from bookings with ratings, if applicable)
    const averageRating = property.rating || 0;

    return NextResponse.json({
      success: true,
      property: {
        ...property,
        stats: {
          totalBookings,
          activeBookings,
          totalRevenue,
          occupancyRate,
          averageRating
        },
        recentBookings
      }
    });

  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Authorization check
    const hasAccess = await canAccessProperty(session.user.id!, params.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this property' },
        { status: 403 }
      );
    }

    // Parse request body
    const updates = await request.json();

    // Validate and sanitize updates
    const allowedFields = [
      'title',
      'description',
      'location',
      'address',
      'price',
      'amenities',
      'rules',
      'maxGuests',
      'bedrooms',
      'beds',
      'bathrooms',
      'propertyType',
      'generalAmenities',
      'name',
      'contactNo',
      'email',
      'hotelEmail',
      'googleMapLink',
      'mealPricing',
      'roomRestrictions'
    ];

    const sanitizedUpdates: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // Update property
    const property = await Property.findByIdAndUpdate(
      params.id,
      sanitizedUpdates,
      { new: true, runValidators: true }
    ).lean();

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      property
    });

  } catch (error: any) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}
