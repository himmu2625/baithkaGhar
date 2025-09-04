import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventCheckin from '@/models/EventCheckin';
import EventBooking from '@/models/EventBooking';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/checkin - Get check-in sessions for property
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const eventBookingId = searchParams.get('eventBookingId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Build query
    const query: any = { propertyId, isActive: true };
    
    if (eventBookingId) {
      query.eventBookingId = eventBookingId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query['eventDetails.eventDate'] = { $gte: startOfDay, $lte: endOfDay };
    }

    const checkins = await EventCheckin.find(query)
      .populate('eventBookingId', 'bookingNumber eventName')
      .populate('createdBy', 'name email')
      .populate('checkinSessions.staffMemberId', 'name')
      .sort({ 'eventDetails.eventDate': -1 })
      .lean();

    // Calculate aggregate stats
    const totalStats = checkins.reduce((acc, checkin: any) => ({
      totalEvents: acc.totalEvents + 1,
      totalExpectedGuests: acc.totalExpectedGuests + checkin.checkinStats.totalExpected,
      totalCheckedIn: acc.totalCheckedIn + checkin.checkinStats.totalCheckedIn,
      totalNoShows: acc.totalNoShows + checkin.checkinStats.totalNoShows
    }), {
      totalEvents: 0,
      totalExpectedGuests: 0,
      totalCheckedIn: 0,
      totalNoShows: 0
    });

    const overallCheckinRate = totalStats.totalExpectedGuests > 0 
      ? Math.round((totalStats.totalCheckedIn / totalStats.totalExpectedGuests) * 100)
      : 0;

    return NextResponse.json({
      checkins,
      stats: {
        ...totalStats,
        overallCheckinRate
      }
    });
  });
}

// POST /api/events/checkin - Create new check-in session
export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      propertyId,
      eventBookingId,
      checkinConfig,
      guestList = []
    } = body;

    // Validation
    if (!propertyId || !eventBookingId) {
      return NextResponse.json({ 
        error: 'Property ID and Event Booking ID are required' 
      }, { status: 400 });
    }

    // Get event booking details
    const eventBooking = await EventBooking.findById(eventBookingId);
    if (!eventBooking) {
      return NextResponse.json({ error: 'Event booking not found' }, { status: 404 });
    }

    // Check if check-in session already exists for this booking
    const existingCheckin = await EventCheckin.findOne({ eventBookingId });
    if (existingCheckin) {
      return NextResponse.json({ 
        error: 'Check-in session already exists for this event' 
      }, { status: 409 });
    }

    // Create check-in session
    const checkinData = {
      propertyId,
      eventBookingId,
      eventDetails: {
        eventName: eventBooking.eventName,
        eventDate: eventBooking.eventDate,
        venueId: eventBooking.venueId,
        venueName: '', // Will be populated by venue lookup
        expectedGuests: eventBooking.expectedGuests
      },
      checkinConfig: {
        checkinStartTime: checkinConfig?.checkinStartTime || new Date(eventBooking.eventDate),
        checkinEndTime: checkinConfig?.checkinEndTime || new Date(eventBooking.eventDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        allowEarlyCheckin: checkinConfig?.allowEarlyCheckin !== false,
        earlyCheckinMinutes: checkinConfig?.earlyCheckinMinutes || 30,
        requireIdVerification: checkinConfig?.requireIdVerification || false,
        allowGuestAdditions: checkinConfig?.allowGuestAdditions !== false,
        maxGuestAdditions: checkinConfig?.maxGuestAdditions || 2,
        qrCodeEnabled: checkinConfig?.qrCodeEnabled !== false,
        manualCheckinEnabled: checkinConfig?.manualCheckinEnabled !== false
      },
      guestList: guestList.map((guest: any) => ({
        guestName: guest.name || guest.guestName,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        guestType: guest.type || 'primary',
        tableNumber: guest.tableNumber,
        seatNumber: guest.seatNumber,
        mealPreference: guest.mealPreference,
        specialRequirements: guest.specialRequirements || [],
        dietaryRestrictions: guest.dietaryRestrictions || [],
        checkinStatus: 'pending'
      })),
      status: 'setup',
      createdBy: session.user.id
    };

    const checkin = new EventCheckin(checkinData);
    await checkin.save();

    // Generate QR codes if enabled
    if (checkinData.checkinConfig.qrCodeEnabled) {
      await checkin.generateQRCodes();
    }

    // Populate response
    await checkin.populate('eventBookingId', 'bookingNumber eventName');

    return NextResponse.json({ 
      checkin,
      message: 'Check-in session created successfully' 
    }, { status: 201 });
  });
}