import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';

// GET /api/os/notifications - Get user's notifications
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    // Build query
    const query: any = { userId: session.user.id };

    if (unreadOnly) {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('bookingId', 'dateFrom dateTo status')
      .populate('propertyId', 'title')
      .lean();

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/os/notifications - Create a new notification (for testing/admin)
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, type' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await Notification.create({
      userId: session.user.id,
      type: body.type,
      title: body.title,
      message: body.message,
      icon: body.icon,
      link: body.link,
      bookingId: body.bookingId,
      propertyId: body.propertyId,
      roomId: body.roomId,
      priority: body.priority || 'medium',
      actionLabel: body.actionLabel,
      actionUrl: body.actionUrl,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
    });

    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
