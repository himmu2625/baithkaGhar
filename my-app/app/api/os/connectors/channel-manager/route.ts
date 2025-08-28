import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ChannelManagerConnector } from '@/lib/connectors/channel-manager-connector';
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

    const connector = new ChannelManagerConnector(propertyId);
    
    const action = request.nextUrl.searchParams.get('action');
    
    switch (action) {
      case 'sync-all-channels':
        const syncResult = await connector.syncAllChannels();
        return NextResponse.json(syncResult);
        
      case 'get-channel-performance':
        const performance = await connector.getChannelPerformance();
        return NextResponse.json(performance);
        
      case 'get-rate-parity':
        const rateParity = await connector.getRateParity();
        return NextResponse.json(rateParity);
        
      default:
        const status = await connector.getOverallStatus();
        return NextResponse.json(status);
    }
  } catch (error) {
    console.error('Channel Manager error:', error);
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

    const connector = new ChannelManagerConnector(body.propertyId);
    
    switch (body.action) {
      case 'bulk-update-rates':
        const rateResult = await connector.bulkUpdateRates(body.rates);
        return NextResponse.json(rateResult);
        
      case 'bulk-update-availability':
        const availResult = await connector.bulkUpdateAvailability(body.availability);
        return NextResponse.json(availResult);
        
      case 'configure-channel':
        const config = await connector.configureChannel(body.channelId, body.configuration);
        return NextResponse.json(config);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Channel Manager error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}