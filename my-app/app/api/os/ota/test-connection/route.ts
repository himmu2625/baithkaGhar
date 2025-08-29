import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getChannelFactory } from '@/src/channels/ChannelFactory';
import { createLogger } from '@/src/channels/utils/Logger';

const logger = createLogger('test-connection-api');

// OTA Channel Config Schema for retrieving credentials
const OTAChannelConfigSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  channelName: { type: String, required: true },
  channelDisplayName: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  credentials: { type: Object, required: true },
  channelSettings: {
    currencyCode: { type: String, default: 'INR' },
    defaultMealPlan: { type: String, default: 'EP' },
    autoSync: { type: Boolean, default: true },
    syncFrequencyMinutes: { type: Number, default: 30 }
  },
  connectionStatus: { 
    type: String, 
    enum: ['connected', 'disconnected', 'error', 'testing'], 
    default: 'disconnected' 
  },
  lastTestAt: { type: Date }
}, { 
  collection: 'otachannelconfigs',
  timestamps: true 
});

const OTAChannelConfig = mongoose.models.OTAChannelConfig || 
                        mongoose.model('OTAChannelConfig', OTAChannelConfigSchema);

export async function POST(request: NextRequest) {
  try {
    const { propertyId, channelName, credentials: providedCredentials } = await request.json();

    if (!propertyId || !channelName) {
      return NextResponse.json(
        { error: 'Missing propertyId or channelName' },
        { status: 400 }
      );
    }

    logger.info('Testing OTA channel connection', { propertyId, channelName });

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);

    let credentials = providedCredentials;

    // If no credentials provided, try to get them from database
    if (!credentials) {
      const channelConfig = await OTAChannelConfig.findOne({ 
        propertyId, 
        channelName 
      });

      if (!channelConfig) {
        return NextResponse.json(
          { 
            success: false,
            connected: false,
            error: 'Channel configuration not found. Please configure the channel first.',
            channelName,
            propertyId
          },
          { status: 404 }
        );
      }

      credentials = channelConfig.credentials;
    }

    // Validate credentials exist
    if (!credentials || Object.keys(credentials).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          connected: false,
          error: 'No credentials found for this channel',
          channelName,
          propertyId
        },
        { status: 400 }
      );
    }

    // Get channel factory and test connection
    const channelFactory = getChannelFactory({
      enablePooling: false, // Don't pool for testing
      autoConnect: false
    });

    const result = await channelFactory.testChannelConnection(channelName, credentials);

    // Update database with test results
    await OTAChannelConfig.findOneAndUpdate(
      { propertyId, channelName },
      { 
        lastTestAt: new Date(),
        connectionStatus: result.success ? 'connected' : 'error'
      },
      { upsert: false }
    );

    logger.info('Channel connection test completed', { 
      propertyId, 
      channelName, 
      success: result.success,
      responseTime: result.responseTime
    });

    return NextResponse.json({
      success: result.success,
      connected: result.success,
      responseTime: result.responseTime,
      error: result.error,
      channelName,
      propertyId,
      testedAt: new Date().toISOString(),
      details: result.details
    });

  } catch (error) {
    logger.error('Error testing connection', error as Error);
    
    return NextResponse.json(
      { 
        success: false,
        connected: false,
        error: `Failed to test connection: ${(error as Error).message}`,
        testedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}