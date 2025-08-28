import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, channelName } = await request.json();

    if (!propertyId || !channelName) {
      return NextResponse.json(
        { error: 'Missing propertyId or channelName' },
        { status: 400 }
      );
    }

    // Simulate connection test with a delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Simulate different success/failure scenarios for demonstration
    const scenarios = [
      { success: true, connected: true, responseTime: 1200 },
      { success: true, connected: true, responseTime: 856 },
      { success: false, connected: false, error: 'Invalid API credentials' },
      { success: false, connected: false, error: 'Network timeout' },
      { success: true, connected: true, responseTime: 2340 }
    ];

    // Choose scenario based on channel name for consistency in demo
    const scenarioIndex = channelName === 'booking.com' ? 0 : 
                         channelName === 'oyo' ? 1 : 
                         channelName === 'makemytrip' ? 4 : 2;
    
    const result = scenarios[scenarioIndex];

    return NextResponse.json({
      ...result,
      channelName,
      propertyId,
      testedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}