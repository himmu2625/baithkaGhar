import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ExpediaConnector } from '@/lib/channels/expedia-connector';
import { validateOSAccess } from '@/lib/auth/os-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const propertyId = request.nextUrl.searchParams.get('propertyId');

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized or missing propertyId' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const connector = new ExpediaConnector(propertyId);
    
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'sync-inventory':
        const syncResult = await connector.syncInventory();
        return NextResponse.json(syncResult);
        
      case 'get-reservations':
        const reservations = await connector.getReservations();
        return NextResponse.json(reservations);
        
      case 'update-availability':
        const availability = await connector.updateAvailability();
        return NextResponse.json(availability);
        
      default:
        const status = await connector.getConnectionStatus();
        return NextResponse.json(status);
    }
  } catch (error) {
    console.error('Expedia API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const connector = new ExpediaConnector(body.propertyId);
    
    switch (body.action) {
      case 'update-rates':
        const result = await connector.updateRates(body.rates);
        return NextResponse.json(result);
        
      case 'modify-reservation':
        const modified = await connector.modifyReservation(body.reservationId, body.modifications);
        return NextResponse.json(modified);
        
      case 'cancel-reservation':
        const cancelled = await connector.cancelReservation(body.reservationId);
        return NextResponse.json(cancelled);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Expedia API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}