import { NextRequest, NextResponse } from 'next/server';
import { OTAService } from '@/lib/services/ota';
import { getAllChannels, getChannelMetadata, getChannelsByCategory } from '@/config/ota-channels';

// POST /api/os/ota-management - Initialize OTA service and perform operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, enabledChannels, action } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const otaService = new OTAService({
      propertyId,
      enabledChannels: enabledChannels || []
    });

    let result;

    switch (action) {
      case 'testConnections':
        result = await otaService.testAllConnections();
        break;

      case 'syncInventory':
        result = await otaService.syncInventoryToAllChannels();
        break;

      case 'getBookings':
        const { fromDate, toDate } = body;
        result = await otaService.getBookingsFromAllChannels(
          fromDate ? new Date(fromDate) : undefined,
          toDate ? new Date(toDate) : undefined
        );
        break;

      case 'getStatistics':
        result = await otaService.getChannelStatistics();
        break;

      case 'enableChannel':
        const { channelName } = body;
        if (!channelName) {
          return NextResponse.json(
            { error: 'Channel name is required' },
            { status: 400 }
          );
        }
        const enabled = await otaService.enableChannel(channelName);
        result = { success: enabled, channelName, enabled };
        break;

      case 'disableChannel':
        const { channelName: disableChannelName } = body;
        if (!disableChannelName) {
          return NextResponse.json(
            { error: 'Channel name is required' },
            { status: 400 }
          );
        }
        const disabled = otaService.disableChannel(disableChannelName);
        result = { success: disabled, channelName: disableChannelName, disabled };
        break;

      case 'testSingleChannel':
        const { channelName: testChannelName } = body;
        if (!testChannelName) {
          return NextResponse.json(
            { error: 'Channel name is required' },
            { status: 400 }
          );
        }
        
        const connector = otaService.getConnector(testChannelName);
        if (!connector) {
          return NextResponse.json(
            { error: 'Channel connector not found' },
            { status: 404 }
          );
        }
        
        result = await connector.getConnectionStatus();
        break;

      case 'syncToSingleChannel':
        const { channelName: syncChannelName } = body;
        if (!syncChannelName) {
          return NextResponse.json(
            { error: 'Channel name is required' },
            { status: 400 }
          );
        }
        
        const syncConnector = otaService.getConnector(syncChannelName);
        if (!syncConnector) {
          return NextResponse.json(
            { error: 'Channel connector not found' },
            { status: 404 }
          );
        }
        
        result = await syncConnector.syncInventory();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    // Cleanup
    otaService.destroy();

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      result
    });

  } catch (error) {
    console.error('OTA Management API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/os/ota-management - Get OTA configuration and available channels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category') as 'international' | 'indian' | 'domestic' | null;

    let channels;
    
    if (category) {
      channels = getChannelsByCategory(category);
    } else {
      channels = getAllChannels();
    }

    const channelSummary = channels.map(channel => ({
      channelName: channel.channelName,
      displayName: channel.displayName,
      category: channel.category,
      region: channel.region,
      features: channel.features,
      requiredCredentials: channel.requiredCredentials,
      optionalCredentials: channel.optionalCredentials,
      website: channel.website,
      description: channel.description
    }));

    const categories = {
      international: getChannelsByCategory('international').length,
      indian: getChannelsByCategory('indian').length,
      domestic: getChannelsByCategory('domestic').length
    };

    return NextResponse.json({
      success: true,
      totalChannels: channels.length,
      categories,
      channels: channelSummary,
      ...(propertyId && { propertyId })
    });

  } catch (error) {
    console.error('OTA Management GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/os/ota-management - Update OTA configuration for property
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, channelConfigs } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    if (!channelConfigs || !Array.isArray(channelConfigs)) {
      return NextResponse.json(
        { error: 'Channel configurations are required' },
        { status: 400 }
      );
    }

    // Validate each channel configuration
    const validationErrors: string[] = [];
    
    for (const config of channelConfigs) {
      const { channelName, enabled, credentials } = config;
      
      if (!channelName) {
        validationErrors.push('Channel name is required for all configurations');
        continue;
      }
      
      const metadata = getChannelMetadata(channelName);
      if (!metadata) {
        validationErrors.push(`Unknown channel: ${channelName}`);
        continue;
      }
      
      if (enabled && credentials) {
        // Check required credentials
        for (const requiredCred of metadata.requiredCredentials) {
          if (!credentials[requiredCred]) {
            validationErrors.push(
              `Missing required credential '${requiredCred}' for channel '${channelName}'`
            );
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors 
        },
        { status: 400 }
      );
    }

    // Here you would typically save to database
    // For now, we'll just return success with the configuration
    
    const enabledChannels = channelConfigs
      .filter(config => config.enabled)
      .map(config => config.channelName);

    return NextResponse.json({
      success: true,
      propertyId,
      totalChannels: channelConfigs.length,
      enabledChannels: enabledChannels.length,
      channels: enabledChannels,
      message: `Updated OTA configuration for property ${propertyId}`
    });

  } catch (error) {
    console.error('OTA Management PUT API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}