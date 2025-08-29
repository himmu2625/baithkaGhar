import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getChannelFactory } from '@/src/channels/ChannelFactory';
import { createLogger } from '@/src/channels/utils/Logger';
import { InventoryData } from '@/src/channels/types';

const logger = createLogger('sync-inventory-api');

// OTA Channel Config Schema
const OTAChannelConfigSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  channelName: { type: String, required: true },
  channelDisplayName: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  credentials: { type: Object, required: true },
  connectionStatus: { 
    type: String, 
    enum: ['connected', 'disconnected', 'error', 'testing'], 
    default: 'disconnected' 
  },
  syncStatus: { 
    type: String, 
    enum: ['active', 'syncing', 'error', 'paused'], 
    default: 'paused' 
  },
  lastSyncAt: { type: Date },
  syncErrorCount: { type: Number, default: 0 }
}, { 
  collection: 'otachannelconfigs',
  timestamps: true 
});

const OTAChannelConfig = mongoose.models.OTAChannelConfig || 
                        mongoose.model('OTAChannelConfig', OTAChannelConfigSchema);

export async function POST(request: NextRequest) {
  try {
    const { propertyId, channelName, inventoryData } = await request.json();

    if (!propertyId || !channelName) {
      return NextResponse.json(
        { error: 'Missing propertyId or channelName' },
        { status: 400 }
      );
    }

    logger.info('Starting inventory sync', { propertyId, channelName });

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);

    // Get channel configuration
    const channelConfig = await OTAChannelConfig.findOne({ 
      propertyId, 
      channelName 
    });

    if (!channelConfig) {
      return NextResponse.json(
        { error: 'Channel configuration not found. Please configure the channel first.' },
        { status: 404 }
      );
    }

    if (!channelConfig.enabled) {
      return NextResponse.json(
        { error: 'Channel is disabled. Please enable the channel first.' },
        { status: 400 }
      );
    }

    // Get credentials
    const credentials = channelConfig.credentials;
    if (!credentials || Object.keys(credentials).length === 0) {
      return NextResponse.json(
        { error: 'No credentials found for this channel' },
        { status: 400 }
      );
    }

    // Update sync status to syncing
    await OTAChannelConfig.findOneAndUpdate(
      { propertyId, channelName },
      { syncStatus: 'syncing' }
    );

    // Get channel factory and create channel instance
    const channelFactory = getChannelFactory();
    const channel = await channelFactory.createChannel(channelName, credentials);

    // Prepare inventory data
    let inventory: InventoryData[] = inventoryData;
    
    // If no inventory data provided, generate sample data for next 30 days
    if (!inventory || inventory.length === 0) {
      inventory = generateSampleInventoryData(propertyId);
      logger.info('No inventory data provided, using sample data', { 
        propertyId, 
        channelName,
        inventoryCount: inventory.length 
      });
    }

    // Perform inventory sync
    const syncResult = await channel.syncInventory(propertyId, inventory);

    // Update database with sync results
    await OTAChannelConfig.findOneAndUpdate(
      { propertyId, channelName },
      { 
        syncStatus: syncResult.success ? 'active' : 'error',
        lastSyncAt: new Date(),
        syncErrorCount: syncResult.success ? 0 : channelConfig.syncErrorCount + 1
      }
    );

    logger.info('Inventory sync completed', { 
      propertyId, 
      channelName, 
      success: syncResult.success,
      processedCount: syncResult.processedCount,
      successCount: syncResult.successCount,
      failureCount: syncResult.failureCount
    });

    return NextResponse.json({
      success: syncResult.success,
      syncId: `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      propertyId,
      channelName,
      processedCount: syncResult.processedCount,
      successCount: syncResult.successCount,
      failureCount: syncResult.failureCount,
      duration: syncResult.duration,
      status: syncResult.status,
      failures: syncResult.failures,
      startedAt: syncResult.timestamp.toISOString(),
      message: `Inventory sync ${syncResult.success ? 'completed successfully' : 'completed with errors'} for ${channelName}`
    });

  } catch (error) {
    logger.error('Error during inventory sync', error as Error);
    
    // Update sync status to error
    try {
      await OTAChannelConfig.findOneAndUpdate(
        { propertyId: request.json().then(data => data.propertyId), channelName: request.json().then(data => data.channelName) },
        { syncStatus: 'error' }
      );
    } catch (dbError) {
      logger.warn('Failed to update sync status after error', dbError as Error);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: `Failed to sync inventory: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Generate sample inventory data for testing
 */
function generateSampleInventoryData(propertyId: string): InventoryData[] {
  const inventory: InventoryData[] = [];
  const roomTypes = ['standard', 'deluxe', 'suite', 'executive'];
  const today = new Date();

  // Generate inventory for next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    // Generate inventory for each room type
    for (const roomType of roomTypes) {
      inventory.push({
        propertyId,
        roomTypeId: roomType,
        date: dateString,
        availability: Math.floor(Math.random() * 10) + 1, // 1-10 rooms available
        minStay: 1,
        maxStay: 7,
        closedToArrival: Math.random() < 0.1, // 10% chance of CTA
        closedToDeparture: Math.random() < 0.05 // 5% chance of CTD
      });
    }
  }

  return inventory;
}