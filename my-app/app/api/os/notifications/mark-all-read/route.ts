import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';

// POST /api/os/notifications/mark-all-read - Mark all notifications as read
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

    // Mark all as read
    const result = await Notification.updateMany(
      { userId: session.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`,
    });

  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
