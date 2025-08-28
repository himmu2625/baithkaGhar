import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Same schema as above for consistency
const OTAChannelConfigSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  channelName: { type: String, required: true },
  channelDisplayName: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  credentials: { type: Object, required: true },
  roomTypeMappings: [{ type: Object }],
  ratePlanMappings: [{ type: Object }],
  channelSettings: {
    currencyCode: { type: String, default: 'INR' },
    defaultMealPlan: { type: String, default: 'EP' },
    autoSync: { type: Boolean, default: true },
    syncFrequencyMinutes: { type: Number, default: 30 }
  },
  syncStatus: { 
    type: String, 
    enum: ['active', 'syncing', 'error', 'paused'], 
    default: 'paused' 
  },
  lastSyncAt: { type: Date },
  syncErrorCount: { type: Number, default: 0 },
  connectionStatus: { 
    type: String, 
    enum: ['connected', 'disconnected', 'error', 'testing'], 
    default: 'disconnected' 
  },
  lastTestAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'otachannelconfigs',
  timestamps: true 
});

const OTAChannelConfig = mongoose.models.OTAChannelConfig || 
                        mongoose.model('OTAChannelConfig', OTAChannelConfigSchema);

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const { propertyId, channelConfig } = await request.json();

    // Validate required fields
    if (!propertyId || !channelConfig) {
      return NextResponse.json(
        { error: 'Missing propertyId or channelConfig' },
        { status: 400 }
      );
    }

    // Update or create channel configuration
    const result = await OTAChannelConfig.findOneAndUpdate(
      { 
        propertyId: propertyId,
        channelName: channelConfig.channelName 
      },
      {
        ...channelConfig,
        propertyId: propertyId,
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
      channelConfig: {
        ...result.toObject(),
        id: result._id?.toString(),
        _id: result._id?.toString()
      }
    });
  } catch (error) {
    console.error('Error saving channel configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save channel configuration' },
      { status: 500 }
    );
  }
}