import { Schema, model, models } from 'mongoose';
import crypto from 'crypto';

// Encryption utilities for sensitive data
const ENCRYPTION_KEY = process.env.OTA_ENCRYPTION_KEY || 'your-32-character-encryption-key!!';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  
  try {
    const [ivHex, encrypted] = text.split(':');
    if (!ivHex || !encrypted) return text;
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return encrypted text if decryption fails
  }
}

const OTAChannelConfigSchema = new Schema({
  // Link to property
  propertyId: {
    type: String,
    required: true,
    ref: 'Property' // References your existing Property model
  },
  
  // Channel identification
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
    ],
    lowercase: true
  },
  channelDisplayName: String, // "Booking.com", "OYO", etc.
  
  // Hotel's credentials on this channel (ENCRYPTED)
  channelPropertyId: {
    type: String,
    required: true // Hotel's ID on this OTA platform
  },
  credentials: {
    apiKey: { 
      type: String, 
      required: true,
      set: encrypt, // Automatically encrypt when saving
      get: decrypt  // Automatically decrypt when reading
    },
    apiSecret: { 
      type: String,
      set: encrypt,
      get: decrypt
    },
    username: { 
      type: String,
      set: encrypt,
      get: decrypt
    },
    password: { 
      type: String,
      set: encrypt,
      get: decrypt
    },
    partnerId: String,
    userId: String,
    hotelId: String, // Alternative identifier
    propertyCode: String, // Some OTAs use codes
    
    // Additional platform-specific credentials
    additionalFields: {
      type: Map,
      of: String,
      set: function(value: Map<string, string>) {
        // Encrypt all additional field values
        const encrypted = new Map();
        value.forEach((val, key) => {
          encrypted.set(key, encrypt(val));
        });
        return encrypted;
      },
      get: function(value: Map<string, string>) {
        // Decrypt all additional field values
        const decrypted = new Map();
        value.forEach((val, key) => {
          decrypted.set(key, decrypt(val));
        });
        return decrypted;
      }
    }
  },
  
  // Configuration and status
  enabled: {
    type: Boolean,
    default: false
  },
  syncStatus: {
    type: String,
    enum: ['active', 'paused', 'error', 'setup_required', 'authentication_failed'],
    default: 'setup_required'
  },
  lastSyncAt: Date,
  lastSuccessfulSyncAt: Date,
  syncErrorCount: {
    type: Number,
    default: 0
  },
  lastErrorMessage: String,
  
  // Sync configuration
  syncSettings: {
    inventorySync: { type: Boolean, default: true },
    rateSync: { type: Boolean, default: true },
    bookingSync: { type: Boolean, default: true },
    availabilitySync: { type: Boolean, default: true },
    autoSync: { type: Boolean, default: true },
    syncFrequencyMinutes: { type: Number, default: 15, min: 5, max: 1440 },
    
    // Sync preferences
    syncWindowDays: { type: Number, default: 365 }, // How many days ahead to sync
    rateSyncTimeOfDay: { type: String, default: '02:00' }, // When to sync rates daily
    inventorySyncInterval: { type: Number, default: 15 }, // Minutes between inventory syncs
  },
  
  // Room type mappings (critical for proper syncing)
  roomTypeMappings: [{
    localRoomTypeId: { type: String, required: true }, // Room type ID in your system
    localRoomTypeName: String, // For reference
    channelRoomTypeId: { type: String, required: true }, // Room type ID on OTA
    channelRoomTypeName: String, // Room type name on OTA
    maxOccupancy: Number,
    bedConfiguration: String,
    amenities: [String],
    isActive: { type: Boolean, default: true },
    mappedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  // Rate plan mappings
  ratePlanMappings: [{
    localRatePlanId: { type: String, required: true },
    localRatePlanName: String,
    channelRatePlanId: { type: String, required: true },
    channelRatePlanName: String,
    isRefundable: Boolean,
    includesBreakfast: Boolean,
    cancellationPolicy: String,
    isActive: { type: Boolean, default: true },
    mappedAt: { type: Date, default: Date.now }
  }],
  
  // Channel-specific settings
  channelSettings: {
    // Booking.com specific
    hotelChainCode: String,
    currencyCode: { type: String, default: 'INR' },
    
    // OYO specific
    oyoPropertyType: String,
    oyoCityId: String,
    
    // MakeMyTrip specific
    mmtHotelCode: String,
    mmtCityCode: String,
    
    // Airbnb specific
    airbnbListingId: String,
    airbnbAccountId: String,
    
    // General settings
    timeZone: { type: String, default: 'Asia/Kolkata' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    
    // Rate and inventory settings
    defaultCancellationPolicy: String,
    defaultMealPlan: { type: String, enum: ['room_only', 'breakfast', 'half_board', 'full_board'], default: 'room_only' },
    allowChildrenBookings: { type: Boolean, default: true },
    maxAdvanceBookingDays: { type: Number, default: 365 },
    minAdvanceBookingDays: { type: Number, default: 0 }
  },
  
  // Performance tracking
  syncStats: {
    totalSyncs: { type: Number, default: 0 },
    successfulSyncs: { type: Number, default: 0 },
    failedSyncs: { type: Number, default: 0 },
    lastMonthBookings: { type: Number, default: 0 },
    lastMonthRevenue: { type: Number, default: 0 },
    averageDailyRate: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 }
  },
  
  // Webhook configuration (for receiving bookings)
  webhookConfig: {
    enabled: { type: Boolean, default: false },
    webhookUrl: String,
    secretKey: { 
      type: String,
      set: encrypt,
      get: decrypt
    },
    lastWebhookReceived: Date,
    webhookErrorCount: { type: Number, default: 0 }
  },
  
  // Compliance and verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: String, // Staff member who verified
  
  // Notes and support
  setupNotes: String,
  supportNotes: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware
OTAChannelConfigSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Indexes for performance
OTAChannelConfigSchema.index({ propertyId: 1, channelName: 1 }, { unique: true });
OTAChannelConfigSchema.index({ propertyId: 1 });
OTAChannelConfigSchema.index({ channelName: 1, enabled: 1 });
OTAChannelConfigSchema.index({ syncStatus: 1 });
OTAChannelConfigSchema.index({ enabled: 1, autoSync: 1 });
OTAChannelConfigSchema.index({ lastSyncAt: 1 });
OTAChannelConfigSchema.index({ 'syncSettings.autoSync': 1, enabled: 1 });
OTAChannelConfigSchema.index({ createdAt: -1 });

// Methods
OTAChannelConfigSchema.methods.canSync = function() {
  return this.enabled && 
         this.syncStatus === 'active' && 
         this.credentials.apiKey &&
         this.channelPropertyId;
};

OTAChannelConfigSchema.methods.incrementErrorCount = function() {
  this.syncErrorCount += 1;
  if (this.syncErrorCount >= 5) {
    this.syncStatus = 'error';
  }
};

OTAChannelConfigSchema.methods.resetErrorCount = function() {
  this.syncErrorCount = 0;
  this.lastErrorMessage = undefined;
  if (this.syncStatus === 'error') {
    this.syncStatus = 'active';
  }
};

// Statics
OTAChannelConfigSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, enabled: true });
};

OTAChannelConfigSchema.statics.findActiveChannels = function() {
  return this.find({ enabled: true, syncStatus: 'active' });
};

// Ensure getters run when converting to JSON
OTAChannelConfigSchema.set('toJSON', { getters: true });
OTAChannelConfigSchema.set('toObject', { getters: true });

const OTAChannelConfig = models.OTAChannelConfig || model('OTAChannelConfig', OTAChannelConfigSchema);

export default OTAChannelConfig;