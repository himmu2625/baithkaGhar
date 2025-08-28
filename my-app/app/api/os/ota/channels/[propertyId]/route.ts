import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Since we don't have the actual OTA models compiled yet, we'll use a simple schema
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

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const channels = await OTAChannelConfig.find({ 
      propertyId: params.propertyId 
    }).lean();

    return NextResponse.json({ 
      channels: channels.map(ch => ({
        ...ch,
        _id: ch._id?.toString(),
        id: ch._id?.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}