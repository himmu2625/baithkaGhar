import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventCheckin from '@/models/EventCheckin';
import { apiHandler } from '@/lib/utils/apiHandler';

interface RouteParams {
  params: {
    checkinId: string;
  };
}

// GET /api/events/checkin/[checkinId] - Get check-in details
export async function GET(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { checkinId } = params;

    const checkin = await EventCheckin.findById(checkinId)
      .populate('eventBookingId', 'bookingNumber eventName')
      .populate('createdBy', 'name email')
      .populate('checkinSessions.staffMemberId', 'name email')
      .populate('guestList.checkedInBy', 'name')
      .lean();

    if (!checkin) {
      return NextResponse.json({ error: 'Check-in session not found' }, { status: 404 });
    }

    return NextResponse.json({ checkin });
  });
}

// PUT /api/events/checkin/[checkinId] - Update check-in session
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { checkinId } = params;
    const updates = await request.json();

    const checkin = await EventCheckin.findById(checkinId);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in session not found' }, { status: 404 });
    }

    // Update allowed fields
    if (updates.status) {
      checkin.status = updates.status;
    }

    if (updates.checkinConfig) {
      Object.assign(checkin.checkinConfig, updates.checkinConfig);
    }

    if (updates.guestList) {
      checkin.guestList = updates.guestList;
    }

    checkin.lastUpdatedBy = session.user.id;
    await checkin.save();

    return NextResponse.json({ 
      checkin,
      message: 'Check-in session updated successfully' 
    });
  });
}

// DELETE /api/events/checkin/[checkinId] - Cancel check-in session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { checkinId } = params;

    const checkin = await EventCheckin.findById(checkinId);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in session not found' }, { status: 404 });
    }

    // Soft delete
    checkin.status = 'cancelled';
    checkin.isActive = false;
    checkin.lastUpdatedBy = session.user.id;
    await checkin.save();

    return NextResponse.json({ message: 'Check-in session cancelled successfully' });
  });
}