import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { BookingComConnector } from '@/lib/channels/booking-com-connector';
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

    const connector = new BookingComConnector(propertyId);
    
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'sync-inventory':
        const syncResult = await connector.syncInventory();
        return NextResponse.json(syncResult);
        
      case 'get-bookings':
        const bookings = await connector.getBookings();
        return NextResponse.json(bookings);
        
      case 'update-rates':
        const rates = await connector.updateRates();
        return NextResponse.json(rates);
        
      default:
        const status = await connector.getConnectionStatus();
        return NextResponse.json(status);
    }
  } catch (error) {
    console.error('Booking.com API error:', error);
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

    const connector = new BookingComConnector(body.propertyId);
    
    switch (body.action) {
      case 'update-inventory':
        const result = await connector.updateInventory(body.data);
        return NextResponse.json(result);
        
      case 'create-booking':
        const booking = await connector.createBooking(body.booking);
        return NextResponse.json(booking);
        
      case 'update-booking':
        const updated = await connector.updateBooking(body.bookingId, body.updates);
        return NextResponse.json(updated);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Booking.com API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}