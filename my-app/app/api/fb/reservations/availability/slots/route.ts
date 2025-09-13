import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const date = searchParams.get('date');
    const partySize = searchParams.get('partySize');

    if (!propertyId || !date || !partySize) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Mock data for development - replace with actual database query
    const mockSlots = [
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
      '20:00', '20:30', '21:00', '21:30', '22:00'
    ];

    // Filter slots based on current time for today's date
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    let availableSlots = mockSlots;
    
    if (date === today) {
      // Only show future slots for today
      availableSlots = mockSlots.filter(slot => {
        const [hour] = slot.split(':');
        return parseInt(hour) > currentHour;
      });
    }

    return NextResponse.json({
      slots: availableSlots,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching slot availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}