import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { OTACoreService } from '@/lib/services/ota/ota-core-service';
import { validateOSAccess } from '@/lib/auth/os-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    
    if (!session || !body.propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, body.propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const otaService = new OTACoreService(body.propertyId);
    
    switch (body.syncType) {
      case 'inventory':
        const inventoryResult = await otaService.syncInventoryAcrossChannels(body.dateRange);
        return NextResponse.json(inventoryResult);
        
      case 'rates':
        const ratesResult = await otaService.syncRatesAcrossChannels(body.dateRange, body.roomTypes);
        return NextResponse.json(ratesResult);
        
      case 'bookings':
        const bookingsResult = await otaService.syncBookingsFromChannels(body.lastSync);
        return NextResponse.json(bookingsResult);
        
      case 'full':
        const fullResult = await otaService.performFullSync();
        return NextResponse.json(fullResult);
        
      default:
        return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
    }
  } catch (error) {
    console.error('OTA Core Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const propertyId = request.nextUrl.searchParams.get('propertyId');

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const otaService = new OTACoreService(propertyId);
    const syncStatus = await otaService.getSyncStatus();
    
    return NextResponse.json(syncStatus);
  } catch (error) {
    console.error('OTA Core Sync status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}