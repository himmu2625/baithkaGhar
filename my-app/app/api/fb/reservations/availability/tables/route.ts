import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const partySize = searchParams.get('partySize');

    if (!propertyId || !date || !time || !partySize) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Mock data for development - replace with actual database query
    const mockTables = [
      {
        id: 'T01',
        name: 'Table 1',
        capacity: 4,
        section: 'Main Hall',
        isAvailable: true,
      },
      {
        id: 'T02',
        name: 'Table 2',
        capacity: 6,
        section: 'Main Hall',
        isAvailable: true,
      },
      {
        id: 'T03',
        name: 'Table 3',
        capacity: 2,
        section: 'Private Dining',
        isAvailable: true,
      },
      {
        id: 'T04',
        name: 'Table 4',
        capacity: 8,
        section: 'Outdoor',
        isAvailable: true,
      },
    ];

    // Filter tables based on party size
    const suitableTables = mockTables.filter(
      table => table.capacity >= parseInt(partySize) && 
               table.capacity <= parseInt(partySize) + 2
    );

    return NextResponse.json({
      tables: suitableTables,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching table availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}