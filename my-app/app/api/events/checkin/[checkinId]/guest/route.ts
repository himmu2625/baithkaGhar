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

// POST /api/events/checkin/[checkinId]/guest - Check in a guest
export async function POST(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { checkinId } = params;
    const body = await request.json();
    
    const {
      guestId,
      method = 'manual',
      location = 'Main Entrance',
      notes,
      additionalGuests = []
    } = body;

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 });
    }

    const checkin = await EventCheckin.findById(checkinId);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in session not found' }, { status: 404 });
    }

    if (checkin.status !== 'active') {
      return NextResponse.json({ 
        error: 'Check-in session is not active' 
      }, { status: 400 });
    }

    // Find the guest
    const guest = checkin.guestList?.find((g: any) => g._id.toString() === guestId);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    if (guest.checkinStatus === 'checked-in') {
      return NextResponse.json({ 
        error: 'Guest is already checked in' 
      }, { status: 409 });
    }

    // Check time restrictions
    const now = new Date();
    const checkinStart = new Date(checkin.checkinConfig.checkinStartTime);
    const earlyCheckinAllowed = checkin.checkinConfig.allowEarlyCheckin;
    const earlyMinutes = checkin.checkinConfig.earlyCheckinMinutes;

    if (!earlyCheckinAllowed && now < checkinStart) {
      return NextResponse.json({ 
        error: 'Check-in has not started yet' 
      }, { status: 400 });
    }

    if (earlyCheckinAllowed) {
      const earlyLimit = new Date(checkinStart.getTime() - (earlyMinutes * 60 * 1000));
      if (now < earlyLimit) {
        return NextResponse.json({ 
          error: `Check-in not allowed until ${earlyMinutes} minutes before start time` 
        }, { status: 400 });
      }
    }

    const checkinEnd = new Date(checkin.checkinConfig.checkinEndTime);
    if (now > checkinEnd) {
      return NextResponse.json({ 
        error: 'Check-in period has ended' 
      }, { status: 400 });
    }

    // Validate additional guests
    if (additionalGuests.length > 0) {
      if (!checkin.checkinConfig.allowGuestAdditions) {
        return NextResponse.json({ 
          error: 'Additional guests are not allowed' 
        }, { status: 400 });
      }

      if (additionalGuests.length > checkin.checkinConfig.maxGuestAdditions) {
        return NextResponse.json({ 
          error: `Maximum ${checkin.checkinConfig.maxGuestAdditions} additional guests allowed` 
        }, { status: 400 });
      }
    }

    // Perform check-in
    await checkin.checkInGuest(guestId, {
      method,
      location,
      notes,
      staffMemberId: session.user.id,
      additionalGuests: additionalGuests.map((g: any) => ({
        name: g.name,
        relation: g.relation,
        checkinTime: new Date()
      }))
    });

    // Get updated checkin data
    const updatedCheckin = await EventCheckin.findById(checkinId)
      .populate('guestList.checkedInBy', 'name')
      .lean();

    return NextResponse.json({ 
      checkin: updatedCheckin,
      message: 'Guest checked in successfully' 
    });
  });
}

// PUT /api/events/checkin/[checkinId]/guest - Update guest status (e.g., mark as no-show)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { checkinId } = params;
    const body = await request.json();
    
    const { guestId, status, notes } = body;

    if (!guestId || !status) {
      return NextResponse.json({ 
        error: 'Guest ID and status are required' 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'checked-in', 'no-show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    const checkin = await EventCheckin.findById(checkinId);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in session not found' }, { status: 404 });
    }

    // Find and update the guest
    const guest = checkin.guestList?.find((g: any) => g._id.toString() === guestId);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    guest.checkinStatus = status;
    if (notes) {
      guest.checkinNotes = notes;
    }

    // Add timeline update
    checkin.timelineUpdates?.push({
      timestamp: new Date(),
      event: 'Guest Status Update',
      description: `${guest.guestName} marked as ${status}`,
      category: 'checkin',
      metadata: {
        guestId: guest._id,
        guestName: guest.guestName,
        previousStatus: guest.checkinStatus,
        newStatus: status,
        updatedBy: session.user.id
      }
    });

    checkin.lastUpdatedBy = session.user.id;
    await checkin.save();

    return NextResponse.json({ 
      checkin,
      message: 'Guest status updated successfully' 
    });
  });
}