import { Schema, model, models } from 'mongoose';

const OTAChannelConfigSchema = new Schema({
  channelName: {
    type: String,
    required: true,
    enum: [
      // International OTAs
      'booking.com', 'expedia', 'agoda', 'airbnb', 'tripadvisor',
      // Indian OTAs
      'makemytrip', 'goibibo', 'cleartrip', 'easemytrip', 'yatra', 
      'ixigo', 'via.com', 'paytm-travel', 'travelguru',
      // Domestic
      'oyo', 'trivago'
    ]
  },
  enabled: {
    type: Boolean,
    default: false
  },
  channelPropertyId: {
    type: String,
    required: true // This is the hotel ID on that specific channel
  },
  credentials: {
    // Channel-specific credentials if needed (usually not needed with master account)
    hotelId: String,
    propertyId: String,
    partnerId: String,
    userId: String,
    customApiKey: String, // Optional: if hotel has their own API key
  },
  mappings: {
    roomTypes: [{
      localRoomTypeId: String,
      channelRoomTypeId: String,
      channelRoomTypeName: String
    }],
    ratePlans: [{
      localRatePlanId: String,
      channelRatePlanId: String,
      channelRatePlanName: String
    }]
  },
  syncSettings: {
    inventorySync: { type: Boolean, default: true },
    rateSync: { type: Boolean, default: true },
    bookingSync: { type: Boolean, default: true },
    autoSync: { type: Boolean, default: true },
    syncFrequencyMinutes: { type: Number, default: 15 }
  },
  lastSync: {
    inventory: Date,
    rates: Date,
    bookings: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'setup_required'],
    default: 'setup_required'
  }
});

const OTAPropertyConfigSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    unique: true,
    ref: 'Property'
  },
  propertyName: String, // Cached for easier lookups
  otaEnabled: {
    type: Boolean,
    default: false
  },
  channels: [OTAChannelConfigSchema],
  globalSettings: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    rateIncludesTax: { type: Boolean, default: true },
    cancellationPolicy: String,
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' }
  },
  contactInfo: {
    managerEmail: String,
    managerPhone: String,
    techContactEmail: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OTAPropertyConfigSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Indexes for better performance
OTAPropertyConfigSchema.index({ propertyId: 1 });
OTAPropertyConfigSchema.index({ 'channels.channelName': 1, 'channels.enabled': 1 });

const OTAPropertyConfig = models.OTAPropertyConfig || model('OTAPropertyConfig', OTAPropertyConfigSchema);

export default OTAPropertyConfig;