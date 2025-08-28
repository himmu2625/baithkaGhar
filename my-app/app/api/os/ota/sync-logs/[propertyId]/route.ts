import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    // For demonstration purposes, we'll return mock sync logs
    // In a real implementation, this would query the InventorySyncLog collection
    
    const mockLogs = [
      {
        id: `log_${Date.now()}_1`,
        syncId: `SYNC_${Date.now()}_abc123`,
        propertyId: params.propertyId,
        channelName: 'booking.com',
        syncType: 'inventory' as const,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
        status: 'completed' as const,
        recordsProcessed: 45,
        successfulRecords: 43,
        failedRecords: 2,
        errors: ['Room type "deluxe-sea-view" not found in channel mapping']
      },
      {
        id: `log_${Date.now()}_2`,
        syncId: `SYNC_${Date.now()}_def456`,
        propertyId: params.propertyId,
        channelName: 'oyo',
        syncType: 'rates' as const,
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 3200).toISOString(),
        status: 'completed' as const,
        recordsProcessed: 32,
        successfulRecords: 32,
        failedRecords: 0,
        errors: []
      },
      {
        id: `log_${Date.now()}_3`,
        syncId: `SYNC_${Date.now()}_ghi789`,
        propertyId: params.propertyId,
        channelName: 'makemytrip',
        syncType: 'inventory' as const,
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 6 * 60 * 60 * 1000 + 8500).toISOString(),
        status: 'failed' as const,
        recordsProcessed: 15,
        successfulRecords: 8,
        failedRecords: 7,
        errors: [
          'API rate limit exceeded',
          'Invalid room type code: RT001',
          'Authentication failed - please check API credentials'
        ]
      },
      {
        id: `log_${Date.now()}_4`,
        syncId: `SYNC_${Date.now()}_jkl012`,
        propertyId: params.propertyId,
        channelName: 'booking.com',
        syncType: 'bookings' as const,
        startTime: new Date(Date.now() - 30 * 1000).toISOString(),
        status: 'running' as const,
        recordsProcessed: 12,
        successfulRecords: 10,
        failedRecords: 0,
        errors: []
      }
    ];

    return NextResponse.json({ 
      logs: mockLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync logs' },
      { status: 500 }
    );
  }
}