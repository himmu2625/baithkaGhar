import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import RoomType from '@/models/RoomType';

// GET /api/os/properties/[id]/room-types - Get all room types for a property
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

    // Authorization check
    const hasAccess = await canAccessProperty(session.user.id!, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this property' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch room types for this property
    const roomTypes = await RoomType.find({
      propertyId: params.id,
      isActive: true,
    })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      roomTypes,
    });

  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    );
  }
}
