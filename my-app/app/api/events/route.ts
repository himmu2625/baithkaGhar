import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Event from '@/models/Event';

// GET: Fetch events filtered by location and date range
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const impact = searchParams.get('impact');

    // Build filter
    const filter: any = { isActive: true };
    
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (region) filter.region = { $regex: region, $options: 'i' };
    if (type) filter.type = type;
    if (impact) filter.impact = impact;

    // Date range filter - events that overlap with the requested period
    if (startDate && endDate) {
      filter.$or = [
        // Event starts within the range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Event ends within the range
        { endDate: { $gte: startDate, $lte: endDate } },
        // Event spans the entire range
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ];
    } else if (startDate) {
      filter.endDate = { $gte: startDate };
    } else if (endDate) {
      filter.startDate = { $lte: endDate };
    }

    const events = await Event.find(filter)
      .sort({ startDate: 1, impact: -1 })
      .lean() as any[];

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        ...event,
        _id: (event as any)._id?.toString?.() ?? ''
      })),
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching events:', error);
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