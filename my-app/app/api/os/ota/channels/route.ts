import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import OTAChannelConfig from '@/models/OTAChannelConfig';

// POST: Create or update channel configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { propertyId, channelConfig } = await request.json();

    if (!session || !propertyId || !channelConfig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Validate required channel data
    const { channelName, channelDisplayName, credentials } = channelConfig;
    if (!channelName || !channelDisplayName) {
      return NextResponse.json(
        { error: 'Channel name and display name are required' }, 
        { status: 400 }
      );
    }

    // Validate credentials based on channel requirements
    if (channelConfig.enabled) {
      const requiredFields = getRequiredFieldsForChannel(channelName);
      const missingFields = requiredFields.filter(field => !credentials[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required credentials: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Create or update channel configuration
    const config = await OTAChannelConfig.findOneAndUpdate(
      { propertyId, channelName },
      {
        propertyId,
        channelName,
        channelDisplayName,
        ...channelConfig,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    return NextResponse.json({
      success: true,
      config: {
        ...config.toObject(),
        _id: config._id?.toString(),
        id: config._id?.toString()
      },
      message: `${channelDisplayName} configuration saved successfully`
    });
  } catch (error) {
    console.error('Channel config save error:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

// GET: List all channels for a property (via query parameter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get('propertyId');

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const channels = await OTAChannelConfig.find({ propertyId }).lean();
    
    return NextResponse.json({ 
      channels: channels.map(ch => ({
        ...ch,
        _id: ch._id?.toString(),
        id: ch._id?.toString()
      }))
    });
  } catch (error) {
    console.error('Channel config fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// DELETE: Remove channel configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get('propertyId');
    const channelName = searchParams.get('channelName');

    if (!session || !propertyId || !channelName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const result = await OTAChannelConfig.findOneAndDelete({ propertyId, channelName });
    
    if (!result) {
      return NextResponse.json({ error: 'Channel configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${channelName} configuration removed successfully`
    });
  } catch (error) {
    console.error('Channel config delete error:', error);
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
}

function getRequiredFieldsForChannel(channelName: string): string[] {
  const requirements: Record<string, string[]> = {
    'booking.com': ['apiKey', 'hotelId'],
    'expedia': ['apiKey', 'propertyId', 'partnerId'],
    'agoda': ['apiKey', 'propertyId'],
    'airbnb': ['apiKey', 'listingId', 'accountId'],
    'tripadvisor': ['apiKey', 'apiSecret', 'propertyId'],
    'makemytrip': ['apiKey', 'hotelCode', 'partnerId'],
    'goibibo': ['apiKey', 'hotelCode', 'partnerId'],
    'cleartrip': ['apiKey', 'propertyId', 'partnerId'],
    'easemytrip': ['apiKey', 'propertyId', 'partnerCode'],
    'yatra': ['apiKey', 'propertyId', 'partnerId'],
    'ixigo': ['apiKey', 'propertyId', 'partnerId'],
    'via.com': ['apiKey', 'hotelId', 'partnerId'],
    'paytm-travel': ['apiKey', 'merchantId', 'hotelCode'],
    'travelguru': ['apiKey', 'propertyId', 'username'],
    'oyo': ['apiKey', 'propertyId'],
    'trivago': ['apiKey', 'hotelId', 'partnerId']
  };
  
  return requirements[channelName] || ['apiKey'];
}