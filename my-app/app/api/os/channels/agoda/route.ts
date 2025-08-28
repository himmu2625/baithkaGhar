import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AgodaConnector } from '@/lib/channels/agoda-connector';
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

    const connector = new AgodaConnector(propertyId);
    
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'sync-property':
        const syncResult = await connector.syncProperty();
        return NextResponse.json(syncResult);
        
      case 'get-bookings':
        const bookings = await connector.getBookings();
        return NextResponse.json(bookings);
        
      case 'update-inventory':
        const inventory = await connector.updateInventory();
        return NextResponse.json(inventory);
        
      default:
        const status = await connector.getConnectionStatus();
        return NextResponse.json(status);
    }
  } catch (error) {
    console.error('Agoda API error:', error);
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

    const connector = new AgodaConnector(body.propertyId);
    
    switch (body.action) {
      case 'push-rates':
        const result = await connector.pushRates(body.rates);
        return NextResponse.json(result);
        
      case 'push-availability':
        const availability = await connector.pushAvailability(body.availability);
        return NextResponse.json(availability);
        
      case 'handle-booking':
        const booking = await connector.handleBooking(body.booking);
        return NextResponse.json(booking);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agoda API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}