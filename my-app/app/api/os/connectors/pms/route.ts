import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PMSConnector } from '@/lib/connectors/pms-connector';
import { validateOSAccess } from '@/lib/auth/os-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const propertyId = request.nextUrl.searchParams.get('propertyId');
    const system = request.nextUrl.searchParams.get('system');

    if (!session || !propertyId || !system) {
      return NextResponse.json({ error: 'Unauthorized or missing parameters' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const connector = new PMSConnector(propertyId, system);
    
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'sync-reservations':
        const reservations = await connector.syncReservations();
        return NextResponse.json(reservations);
        
      case 'get-room-status':
        const roomStatus = await connector.getRoomStatus();
        return NextResponse.json(roomStatus);
        
      case 'get-guest-data':
        const guestData = await connector.getGuestData();
        return NextResponse.json(guestData);
        
      default:
        const status = await connector.getConnectionStatus();
        return NextResponse.json(status);
    }
  } catch (error) {
    console.error('PMS Connector error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    
    if (!session || !body.propertyId || !body.system) {
      return NextResponse.json({ error: 'Unauthorized or missing parameters' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, body.propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const connector = new PMSConnector(body.propertyId, body.system);
    
    switch (body.action) {
      case 'update-room-status':
        const result = await connector.updateRoomStatus(body.roomId, body.status);
        return NextResponse.json(result);
        
      case 'create-reservation':
        const reservation = await connector.createReservation(body.reservationData);
        return NextResponse.json(reservation);
        
      case 'update-guest-profile':
        const guest = await connector.updateGuestProfile(body.guestId, body.profileData);
        return NextResponse.json(guest);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('PMS Connector error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}