import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import OTAPropertyConfig from '@/models/OTAPropertyConfig';
import { dbConnect } from '@/lib/db';

// GET: Retrieve OTA configuration for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession();
    const { propertyId } = params;

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const config = await OTAPropertyConfig.findOne({ propertyId });
    
    if (!config) {
      // Return default configuration structure
      return NextResponse.json({
        propertyId,
        otaEnabled: false,
        channels: [],
        globalSettings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          language: 'en',
          rateIncludesTax: true,
          checkInTime: '14:00',
          checkOutTime: '11:00'
        },
        contactInfo: {},
        isNew: true
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('OTA Config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create or update OTA configuration for a property
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession();
    const { propertyId } = params;
    const body = await request.json();

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    // Validate channel configurations
    const validChannels = ['booking.com', 'expedia', 'agoda'];
    if (body.channels) {
      for (const channel of body.channels) {
        if (!validChannels.includes(channel.channelName)) {
          return NextResponse.json(
            { error: `Invalid channel: ${channel.channelName}` },
            { status: 400 }
          );
        }
        if (channel.enabled && !channel.channelPropertyId) {
          return NextResponse.json(
            { error: `Missing channelPropertyId for ${channel.channelName}` },
            { status: 400 }
          );
        }
      }
    }

    // Upsert configuration
    const config = await OTAPropertyConfig.findOneAndUpdate(
      { propertyId },
      {
        propertyId,
        propertyName: body.propertyName,
        otaEnabled: body.otaEnabled || false,
        channels: body.channels || [],
        globalSettings: {
          ...body.globalSettings,
        },
        contactInfo: body.contactInfo || {},
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
      config,
      message: 'OTA configuration saved successfully'
    });
  } catch (error) {
    console.error('OTA Config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update specific channel configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession();
    const { propertyId } = params;
    const body = await request.json();
    const { channelName, channelConfig } = body;

    if (!session || !propertyId || !channelName || !channelConfig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const config = await OTAPropertyConfig.findOne({ propertyId });
    if (!config) {
      return NextResponse.json({ error: 'Property configuration not found' }, { status: 404 });
    }

    // Find and update the specific channel
    const channelIndex = config.channels.findIndex(
      (ch: any) => ch.channelName === channelName
    );

    if (channelIndex >= 0) {
      config.channels[channelIndex] = { ...config.channels[channelIndex], ...channelConfig };
    } else {
      config.channels.push({ channelName, ...channelConfig });
    }

    config.updatedAt = new Date();
    await config.save();

    return NextResponse.json({
      success: true,
      config,
      message: `${channelName} configuration updated successfully`
    });
  } catch (error) {
    console.error('OTA Config PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove channel configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const session = await getServerSession();
    const { propertyId } = params;
    const { searchParams } = request.nextUrl;
    const channelName = searchParams.get('channel');

    if (!session || !propertyId || !channelName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();
    
    const config = await OTAPropertyConfig.findOneAndUpdate(
      { propertyId },
      {
        $pull: { channels: { channelName } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!config) {
      return NextResponse.json({ error: 'Property configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config,
      message: `${channelName} configuration removed successfully`
    });
  } catch (error) {
    console.error('OTA Config DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}