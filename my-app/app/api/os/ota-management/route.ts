import { NextRequest, NextResponse } from 'next/server';
import { otaCoreService } from '@/lib/services/ota';
import { getAllOTAChannels, getOTAChannelConfig, getOTAChannelsByType } from '@/config/ota-channels';

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

    let result;

    switch (action) {
      case 'testConnections':
        result = await otaCoreService.getSyncStatus(propertyId);
        break;

      case 'syncInventory':
        const inventoryResults = await otaCoreService.syncInventory(propertyId, enabledChannels);
        result = { 
          success: inventoryResults.some(r => r.success), 
          results: inventoryResults,
          message: `Inventory sync completed for ${inventoryResults.filter(r => r.success).length}/${inventoryResults.length} channels`
        };
        break;

      case 'syncRates':
        const rateResults = await otaCoreService.syncRates(propertyId, enabledChannels);
        result = { 
          success: rateResults.some(r => r.success), 
          results: rateResults,
          message: `Rate sync completed for ${rateResults.filter(r => r.success).length}/${rateResults.length} channels`
        };
        break;

      case 'syncAvailability':
        const availabilityResults = await otaCoreService.syncAvailability(propertyId, enabledChannels);
        result = { 
          success: availabilityResults.some(r => r.success), 
          results: availabilityResults,
          message: `Availability sync completed for ${availabilityResults.filter(r => r.success).length}/${availabilityResults.length} channels`
        };
        break;

      case 'testSingleChannel':
        const { channelId, credentials } = body;
        if (!channelId || !credentials) {
          return NextResponse.json(
            { error: 'Channel ID and credentials are required' },
            { status: 400 }
          );
        }
        
        result = await otaCoreService.testConnection(channelId, credentials);
        break;

      case 'updateCredentials':
        const { channelId: updateChannelId, credentials: updateCredentials } = body;
        if (!updateChannelId || !updateCredentials) {
          return NextResponse.json(
            { error: 'Channel ID and credentials are required' },
            { status: 400 }
          );
        }
        
        const updateResult = await otaCoreService.updateChannelCredentials(propertyId, updateChannelId, updateCredentials);
        result = { success: updateResult, channelId: updateChannelId };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

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
    const type = searchParams.get('type');

    let channels;
    
    if (type) {
      channels = getOTAChannelsByType(type);
    } else {
      channels = getAllOTAChannels();
    }

    const channelSummary = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      description: channel.description,
      website: channel.website,
      fields: channel.fields,
      documentation: channel.documentation
    }));

    return NextResponse.json({
      success: true,
      totalChannels: channels.length,
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
      const { channelId, enabled, credentials } = config;
      
      if (!channelId) {
        validationErrors.push('Channel ID is required for all configurations');
        continue;
      }
      
      const channelConfig = getOTAChannelConfig(channelId);
      if (!channelConfig) {
        validationErrors.push(`Unknown channel: ${channelId}`);
        continue;
      }
      
      if (enabled && credentials) {
        // Check required fields
        for (const field of channelConfig.fields) {
          if (field.required && !credentials[field.name]) {
            validationErrors.push(
              `Missing required field '${field.label}' for channel '${channelConfig.name}'`
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
      .map(config => config.channelId);

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