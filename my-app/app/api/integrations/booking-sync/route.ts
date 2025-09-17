import { NextRequest, NextResponse } from 'next/server';
import { BookingSystemIntegration } from '@/lib/integrations/booking-system-integration';

export async function POST(request: NextRequest) {
  try {
    const { action, systemName, config } = await request.json();

    const integration = new BookingSystemIntegration();
    await integration.initialize();

    switch (action) {
      case 'sync':
        if (!systemName) {
          return NextResponse.json(
            { error: 'System name is required for sync' },
            { status: 400 }
          );
        }

        const syncResult = await integration.syncBookingsFromExternal(systemName);
        return NextResponse.json({
          success: true,
          data: syncResult
        });

      case 'test_connection':
        if (!systemName) {
          return NextResponse.json(
            { error: 'System name is required for connection test' },
            { status: 400 }
          );
        }

        const connectionTest = await integration.testConnection(systemName);
        return NextResponse.json({
          success: connectionTest.success,
          data: connectionTest
        });

      case 'setup_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration is required' },
            { status: 400 }
          );
        }

        await integration.setupIntegrationConfig(config);
        return NextResponse.json({
          success: true,
          message: `Configuration saved for ${config.name}`
        });

      case 'sync_all':
        const status = await integration.getIntegrationStatus();
        const activeSystems = Object.keys(status.lastSyncTimes);
        const results = [];

        for (const system of activeSystems) {
          try {
            const result = await integration.syncBookingsFromExternal(system);
            results.push({ system, success: true, data: result });
          } catch (error) {
            results.push({
              system,
              success: false,
              error: (error as Error).message
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            totalSystems: activeSystems.length,
            results
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sync, test_connection, setup_config, or sync_all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Booking integration API error:', error);
    return NextResponse.json(
      { error: 'Integration operation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const integration = new BookingSystemIntegration();
    await integration.initialize();

    const status = await integration.getIntegrationStatus();

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}