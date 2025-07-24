import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Event from '@/models/Event';

// GET: Fetch all events for admin management
export async function GET(req: NextRequest) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const impact = searchParams.get('impact');
    const city = searchParams.get('city');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) filter.type = type;
    if (impact) filter.impact = impact;
    if (city) filter.city = { $regex: city, $options: 'i' };

    const events = await Event.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(filter);

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        ...event,
        _id: (event as any)._id?.toString?.() ?? ''
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST: Create a new event
export async function POST(req: NextRequest) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'startDate', 'endDate', 'city', 'region', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate date order
    if (new Date(body.startDate) > new Date(body.endDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create event with defaults
    const eventData = {
      ...body,
      source: 'admin',
      suggestedPriceMultiplier: body.suggestedPriceMultiplier || 1.2,
      impact: body.impact || 'medium',
      isActive: body.isActive !== undefined ? body.isActive : true,
      tags: body.tags || []
    };

    const event = new Event(eventData);
    await event.save();

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: {
        ...event.toObject(),
        _id: event._id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 