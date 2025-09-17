import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import webpush from 'web-push';

// Only set VAPID details if environment variables are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@baithakaghar.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Push notifications not configured. VAPID keys missing.' },
        { status: 501 }
      );
    }

    const {
      userId,
      userIds,
      role,
      payload,
      category
    }: {
      userId?: string;
      userIds?: string[];
      role?: string;
      payload: NotificationPayload;
      category?: 'maintenance' | 'housekeeping' | 'room' | 'system';
    } = await request.json();

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Payload with title and body is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const subscriptionsCollection = db.collection('push_subscriptions');

    let query: any = { isActive: true };

    if (userId) {
      query.userId = userId;
    } else if (userIds && userIds.length > 0) {
      query.userId = { $in: userIds };
    } else if (role) {
      query.role = role;
    }

    const subscriptions = await subscriptionsCollection.find(query).toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No active subscriptions found' },
        { status: 200 }
      );
    }

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            ...payload,
            timestamp: Date.now(),
            category: category || 'system'
          })
        );

        await subscriptionsCollection.updateOne(
          { _id: sub._id },
          { $set: { lastUsed: new Date() } }
        );

        return { success: true, userId: sub.userId };
      } catch (error: any) {
        console.error(`Failed to send notification to user ${sub.userId}:`, error);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await subscriptionsCollection.updateOne(
            { _id: sub._id },
            { $set: { isActive: false } }
          );
        }

        return { success: false, userId: sub.userId, error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    await db.collection('notification_logs').insertOne({
      payload,
      targetType: userId ? 'user' : (userIds ? 'users' : 'role'),
      targetValue: userId || userIds || role,
      category,
      sentAt: new Date(),
      successful,
      failed,
      results
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      results
    });
  } catch (error) {
    console.error('Push notification send error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { db } = await connectToDatabase();

    let query: any = {};
    if (userId) {
      query = {
        $or: [
          { 'targetValue': userId },
          { 'targetValue': { $in: [userId] } }
        ]
      };
    }

    const logs = await db.collection('notification_logs')
      .find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Get notification logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification logs' },
      { status: 500 }
    );
  }
}