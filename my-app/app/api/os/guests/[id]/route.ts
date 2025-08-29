import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: Fetch guest management data for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Build match query
    const matchQuery: any = {
      propertyId: new ObjectId(propertyId)
    };

    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      matchQuery.status = status;
    }

    // Get guests with pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const guests = await db.collection('guest_profiles')
      .find(matchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalGuests = await db.collection('guest_profiles').countDocuments(matchQuery);

    // Get guest statistics
    const stats = await getGuestStatistics(db, propertyId);

    return NextResponse.json({
      success: true,
      guests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGuests / limit),
        totalGuests,
        hasMore: skip + guests.length < totalGuests
      },
      stats
    });

  } catch (error) {
    console.error('Guest data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch guest data' }, { status: 500 });
  }
}

// POST: Create new guest profile
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate required fields
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      preferences,
      idType,
      idNumber,
      nationality,
      dateOfBirth,
      notes
    } = body;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if guest already exists
    const existingGuest = await db.collection('guest_profiles').findOne({
      propertyId: new ObjectId(propertyId),
      $or: [
        { email },
        { phone }
      ]
    });

    if (existingGuest) {
      return NextResponse.json({ error: 'Guest with this email or phone already exists' }, { status: 409 });
    }

    const guestProfile = {
      propertyId: new ObjectId(propertyId),
      firstName,
      lastName,
      email,
      phone,
      address: address || {},
      preferences: preferences || {
        communication: 'email',
        roomType: 'standard',
        bedType: 'double',
        smokingPreference: 'non-smoking',
        dietaryRestrictions: [],
        specialRequests: []
      },
      idType: idType || '',
      idNumber: idNumber || '',
      nationality: nationality || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      notes: notes || '',
      status: 'active',
      totalBookings: 0,
      totalSpent: 0,
      lastBookingDate: null,
      loyaltyPoints: 0,
      vipStatus: false,
      blacklisted: false,
      communicationHistory: [],
      bookingHistory: [],
      createdBy: session.user?.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('guest_profiles').insertOne(guestProfile);

    // Create welcome communication entry
    await db.collection('guest_communications').insertOne({
      guestId: result.insertedId,
      propertyId: new ObjectId(propertyId),
      type: 'system',
      subject: 'Welcome to Our Property',
      content: `Welcome ${firstName} ${lastName}! Your guest profile has been created successfully.`,
      direction: 'outbound',
      channel: 'system',
      status: 'sent',
      createdBy: session.user?.email,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      guestId: result.insertedId,
      guest: { ...guestProfile, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Guest creation error:', error);
    return NextResponse.json({ error: 'Failed to create guest profile' }, { status: 500 });
  }
}

// PUT: Update guest profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();
    const { guestId, ...updates } = body;

    if (!session || !propertyId || !guestId) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: session.user?.email
    };

    // Handle date conversion for dateOfBirth
    if (updates.dateOfBirth) {
      updateData.dateOfBirth = new Date(updates.dateOfBirth);
    }

    const result = await db.collection('guest_profiles').updateOne(
      {
        _id: new ObjectId(guestId),
        propertyId: new ObjectId(propertyId)
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Guest update error:', error);
    return NextResponse.json({ error: 'Failed to update guest profile' }, { status: 500 });
  }
}

// DELETE: Delete guest profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const guestId = searchParams.get('guestId');

    if (!session || !propertyId || !guestId) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Soft delete - mark as inactive instead of actually deleting
    const result = await db.collection('guest_profiles').updateOne(
      {
        _id: new ObjectId(guestId),
        propertyId: new ObjectId(propertyId)
      },
      {
        $set: {
          status: 'deleted',
          deletedAt: new Date(),
          deletedBy: session.user?.email
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Guest deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete guest profile' }, { status: 500 });
  }
}

// Helper function to get guest statistics
async function getGuestStatistics(db: any, propertyId: string) {
  const pipeline = [
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        status: { $ne: 'deleted' }
      }
    },
    {
      $group: {
        _id: null,
        totalGuests: { $sum: 1 },
        activeGuests: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        vipGuests: {
          $sum: { $cond: ['$vipStatus', 1, 0] }
        },
        blacklistedGuests: {
          $sum: { $cond: ['$blacklisted', 1, 0] }
        },
        totalBookings: { $sum: '$totalBookings' },
        totalRevenue: { $sum: '$totalSpent' },
        averageSpent: { $avg: '$totalSpent' },
        averageLoyaltyPoints: { $avg: '$loyaltyPoints' }
      }
    }
  ];

  const stats = await db.collection('guest_profiles').aggregate(pipeline).toArray();

  // Get recent guests (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentGuests = await db.collection('guest_profiles').countDocuments({
    propertyId: new ObjectId(propertyId),
    createdAt: { $gte: thirtyDaysAgo },
    status: { $ne: 'deleted' }
  });

  // Get guest status distribution
  const statusDistribution = await db.collection('guest_profiles').aggregate([
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        status: { $ne: 'deleted' }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  // Get nationality distribution
  const nationalityDistribution = await db.collection('guest_profiles').aggregate([
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        status: { $ne: 'deleted' },
        nationality: { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$nationality',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();

  const baseStats = stats[0] || {
    totalGuests: 0,
    activeGuests: 0,
    vipGuests: 0,
    blacklistedGuests: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageSpent: 0,
    averageLoyaltyPoints: 0
  };

  return {
    ...baseStats,
    recentGuests,
    statusDistribution,
    nationalityDistribution,
    averageBookingsPerGuest: baseStats.totalGuests > 0 ? baseStats.totalBookings / baseStats.totalGuests : 0
  };
}