import mongoose, { Schema, Document } from 'mongoose';
import User from './User';

export interface IProperty extends Document {
  title: string;
  description: string;
  location: string;
  googleMapLink?: string;
  locationCoords?: {
    lat?: number;
    lng?: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  price: {
    base: number;
    cleaning?: number;
    service?: number;
    tax?: number;
  };
  // Dynamic pricing configuration
  dynamicPricing?: {
    enabled: boolean;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    seasonalRates?: {
      peak: { multiplier: number; months: number[] };
      offPeak: { multiplier: number; months: number[] };
      shoulder: { multiplier: number; months: number[] };
    };
    weeklyRates?: {
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
      sunday: number;
    };
    demandPricing?: {
      lowOccupancy: number;
      mediumOccupancy: number;
      highOccupancy: number;
    };
    competitionSensitivity?: number;
    advanceBookingDiscounts?: {
      "30+ days": number;
      "15-30 days": number;
      "7-15 days": number;
      "1-7 days": number;
    };
    eventPricing?: {
      localEvents: number;
      festivals: number;
      conferences: number;
    };
    lastMinutePremium?: number;
    autoPricing?: {
      enabled: boolean;
      minMultiplier: number;
      maxMultiplier: number;
    };
    // Enhanced features for direct pricing and availability management
    directPricing?: {
      enabled: boolean;
      customPrices: Array<{
        startDate: string;
        endDate: string;
        price: number;
        reason: string; // 'event', 'holiday', 'custom', 'demand_control'
        isActive: boolean;
      }>;
    };
    availabilityControl?: {
      enabled: boolean;
      blockedDates: Array<{
        startDate: string;
        endDate: string;
        reason: string; // 'maintenance', 'demand_control', 'personal', 'event'
        isActive: boolean;
      }>;
      demandControlSettings: {
        enabled: boolean;
        minBlockDuration: number; // minimum days to block for demand control
        maxBlockDuration: number; // maximum days to block for demand control
        targetOccupancyIncrease: number; // target % increase in occupancy after blocking
      };
    };
    // Dynamic minimum stay and booking window rules
    dynamicStayRules?: {
      enabled: boolean;
      minimumStayRules: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        minStay: number; // minimum nights required
        maxStay?: number; // maximum nights allowed (optional)
        triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
        triggerCondition?: {
          occupancyThreshold?: number; // for occupancy-based rules (0-100%)
          demandLevel?: 'low' | 'medium' | 'high'; // for demand-based rules
          eventType?: string; // for event-based rules
        };
        priority: number; // higher number = higher priority when rules overlap
        isActive: boolean;
        description?: string;
      }>;
      bookingWindowRules: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        minAdvanceBooking: number; // minimum days before check-in
        maxAdvanceBooking?: number; // maximum days before check-in (optional)
        lastMinuteBooking: boolean; // allow same-day bookings
        triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
        triggerCondition?: {
          occupancyThreshold?: number;
          demandLevel?: 'low' | 'medium' | 'high';
          eventType?: string;
        };
        priority: number;
        isActive: boolean;
        description?: string;
      }>;
      defaultRules: {
        minStay: number; // default minimum stay when no rules apply
        maxStay?: number; // default maximum stay
        minAdvanceBooking: number; // default advance booking requirement
        maxAdvanceBooking?: number; // default maximum advance booking
        lastMinuteBooking: boolean; // default same-day booking policy
      };
    };
  };
  amenities: string[];
  images: string[];
  rules: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  hostId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  isPublished: boolean;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  propertyType: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId | string;
  name: string;
  contactNo: string;
  email: string;
  hotelEmail?: string;
  generalAmenities: {
    wifi: boolean;
    tv: boolean;
    kitchen: boolean;
    parking: boolean;
    ac: boolean;
    pool: boolean;
    geyser: boolean;
    shower: boolean;
    bathTub: boolean;
    reception24x7: boolean;
    roomService: boolean;
    restaurant: boolean;
    bar: boolean;
    pub: boolean;
    fridge: boolean;
  };
  otherAmenities: string;
  categorizedImages: [{
    category: string;
    files: [{
      url: string;
      public_id: string;
    }];
  }];
  legacyGeneralImages: [{
    url: string;
    public_id: string;
  }];
  propertyUnits: [{
    unitTypeName: string;
    unitTypeCode: string;
    count: number;
    pricing: {
      price: string;
      pricePerWeek: string;
      pricePerMonth: string;
    };
  }];
  pricing: {
    perNight: string;
    perWeek: string;
    perMonth: string;
  };
  totalHotelRooms: string;
  status: 'available' | 'unavailable' | 'maintenance' | 'deleted';
  policyDetails: string;
  minStay: string;
  maxStay: string;
  propertySize: string;
  availability: string;
  stayTypes: string[];
}

const PropertySchema = new Schema<IProperty>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  googleMapLink: { type: String },
  locationCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  price: {
    base: { type: Number, required: true },
    cleaning: { type: Number },
    service: { type: Number },
    tax: { type: Number }
  },
  dynamicPricing: {
    enabled: { type: Boolean, default: false },
    basePrice: { type: Number, default: 0 },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    // Remove all default mock data - only store if explicitly set by admin
    seasonalRates: { type: Object },
    weeklyRates: { type: Object },
    demandPricing: { type: Object },
    competitionSensitivity: { type: Number },
    advanceBookingDiscounts: { type: Object },
    eventPricing: { type: Object },
    lastMinutePremium: { type: Number },
    autoPricing: { type: Object },
    // Enhanced features for direct pricing and availability management
    directPricing: {
      enabled: { type: Boolean, default: false },
      customPrices: [{
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        reason: { 
          type: String, 
          enum: ['event', 'holiday', 'custom', 'demand_control'],
          default: 'custom'
        },
        isActive: { type: Boolean, default: true }
      }]
    },
    availabilityControl: {
      enabled: { type: Boolean, default: false },
      blockedDates: [{
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        reason: { 
          type: String, 
          enum: ['maintenance', 'demand_control', 'personal', 'event'],
          default: 'demand_control'
        },
        isActive: { type: Boolean, default: true }
      }],
      demandControlSettings: {
        enabled: { type: Boolean, default: false },
        minBlockDuration: { type: Number, default: 3, min: 1 },
        maxBlockDuration: { type: Number, default: 14, min: 1 },
        targetOccupancyIncrease: { type: Number, default: 20, min: 5, max: 100 }
      }
    },
    // Dynamic minimum stay and booking window rules schema
    dynamicStayRules: {
      enabled: { type: Boolean, default: false },
      minimumStayRules: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        minStay: { type: Number, required: true, min: 1, max: 365 },
        maxStay: { type: Number, min: 1, max: 365 },
        triggerType: { 
          type: String, 
          enum: ['season', 'demand', 'occupancy', 'event', 'custom'],
          required: true
        },
        triggerCondition: {
          occupancyThreshold: { type: Number, min: 0, max: 100 },
          demandLevel: { type: String, enum: ['low', 'medium', 'high'] },
          eventType: { type: String }
        },
        priority: { type: Number, required: true, default: 1 },
        isActive: { type: Boolean, default: true },
        description: { type: String }
      }],
      bookingWindowRules: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        minAdvanceBooking: { type: Number, required: true, min: 0, max: 365 },
        maxAdvanceBooking: { type: Number, min: 1, max: 365 },
        lastMinuteBooking: { type: Boolean, default: false },
        triggerType: { 
          type: String, 
          enum: ['season', 'demand', 'occupancy', 'event', 'custom'],
          required: true
        },
        triggerCondition: {
          occupancyThreshold: { type: Number, min: 0, max: 100 },
          demandLevel: { type: String, enum: ['low', 'medium', 'high'] },
          eventType: { type: String }
        },
        priority: { type: Number, required: true, default: 1 },
        isActive: { type: Boolean, default: true },
        description: { type: String }
      }],
      defaultRules: {
        minStay: { type: Number, default: 1, min: 1, max: 365 },
        maxStay: { type: Number, min: 1, max: 365 },
        minAdvanceBooking: { type: Number, default: 0, min: 0, max: 365 },
        maxAdvanceBooking: { type: Number, min: 1, max: 365 },
        lastMinuteBooking: { type: Boolean, default: true }
      }
    }
  },
  amenities: [{ type: String }],
  images: [{ type: String }],
  rules: [{ type: String }],
  maxGuests: { type: Number, required: true, default: 1 },
  bedrooms: { type: Number, required: true, default: 1 },
  beds: { type: Number, required: true, default: 1 },
  bathrooms: { type: Number, required: true, default: 1 },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'house', 'hotel', 'villa', 'resort']
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  verificationNotes: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  contactNo: { type: String, required: true },
  email: { type: String, required: true },
  hotelEmail: { type: String, required: false, validate: {
    validator: function(email: string) {
      if (!email) return true; // Allow empty/null values
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    message: 'Please enter a valid hotel email address'
  }},
  generalAmenities: {
    wifi: { type: Boolean, required: true },
    tv: { type: Boolean, required: true },
    kitchen: { type: Boolean, required: true },
    parking: { type: Boolean, required: true },
    ac: { type: Boolean, required: true },
    pool: { type: Boolean, required: true },
    geyser: { type: Boolean, required: true },
    shower: { type: Boolean, required: true },
    bathTub: { type: Boolean, required: true },
    reception24x7: { type: Boolean, required: true },
    roomService: { type: Boolean, required: true },
    restaurant: { type: Boolean, required: true },
    bar: { type: Boolean, required: true },
    pub: { type: Boolean, required: true },
    fridge: { type: Boolean, required: true }
  },
  otherAmenities: { type: String },
  categorizedImages: [{
    category: { type: String, required: true },
    files: [{
      url: { type: String, required: true },
      public_id: { type: String, required: true }
    }]
  }],
  legacyGeneralImages: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }],
  propertyUnits: [{
    unitTypeName: { type: String, required: true },
    unitTypeCode: { type: String, required: true },
    count: { type: Number, required: true },
    pricing: {
      price: { type: String, required: true },
      pricePerWeek: { type: String, required: true },
      pricePerMonth: { type: String, required: true }
    }
  }],
  pricing: {
    perNight: { type: String, required: true },
    perWeek: { type: String, required: true },
    perMonth: { type: String, required: true }
  },
  totalHotelRooms: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'maintenance', 'deleted'],
    default: 'available'
  },
  policyDetails: { type: String, required: true },
  minStay: { type: String, required: true },
  maxStay: { type: String, required: true },
  propertySize: { type: String, required: true },
  availability: { type: String, required: true },
  stayTypes: {
    type: [String],
    enum: ['corporate-stay', 'family-stay', 'couple-stay', 'banquet-events', 'travel-agent'],
    default: []
  },
}, {
  timestamps: true
});

// Pre-save hook to handle auto-approval for admin/super_admin users
PropertySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('hostId') || this.isModified('userId')) {
    try {
      // Check if the user is an admin or super_admin
      const user = await User.findById(this.userId);
      
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        // Auto-approve and publish properties created by admins
        this.verificationStatus = 'approved';
        this.isPublished = true;
        this.verifiedAt = new Date();
        this.verifiedBy = this.userId; // Self-verification
      } else {
        // For regular users, set to pending
        this.verificationStatus = 'pending';
        this.isPublished = false;
      }
    } catch (error) {
      console.error('Error in property pre-save hook:', error);
      // Continue saving even if this fails
    }
  }
  next();
});

// Post-save hook to keep city property counts in sync
PropertySchema.post('save', async function(this: mongoose.Document & IProperty) {
  try {
    // Always normalize city name on save to ensure consistency
    const rawCityName = this.address?.city;
    if (rawCityName) {
      const { normalizeCityName } = require('../lib/utils/city-utils');
      const normalizedCityName = normalizeCityName(rawCityName);
      
      // If the normalized name is different, update the property
      if (normalizedCityName !== rawCityName) {
        await mongoose.model('Property').findByIdAndUpdate(this._id, {
          'address.city': normalizedCityName
        });
        console.log(`Normalized city name from "${rawCityName}" to "${normalizedCityName}"`);
      }
    }

    // Only update city counts for published and approved properties
    if (this.isPublished && this.verificationStatus === 'approved' && 
        this.status === 'available') {
      // Get the property's city name
      const cityName = this.address?.city;
      
      if (cityName) {
        // Import city utilities
        const { normalizeCityName, getCityRegex } = require('../lib/utils/city-utils');
        
        // Normalize the city name to proper title case
        const normalizedCityName = normalizeCityName(cityName);
        
        // Import City model
        const City = mongoose.models.City || mongoose.model('City', require('./city').default.schema);

        // Find the city by name (case-insensitive with flexible formatting)
        const cityRegex = getCityRegex(normalizedCityName);
        let city = await City.findOne({ name: { $regex: cityRegex } });
        
        // If no city found with flexible regex, try exact match
        if (!city) {
          city = await City.findOne({ name: normalizedCityName });
        }
        
        if (city) {
          // Ensure city name is properly normalized
          if (city.name !== normalizedCityName) {
            await City.findByIdAndUpdate(city._id, { name: normalizedCityName });
            console.log(`Normalized city name in database from "${city.name}" to "${normalizedCityName}"`);
          }
          
          // Get count of properties in this city using flexible regex
          const propertyCount = await mongoose.model('Property').countDocuments({
            isPublished: true,
            verificationStatus: 'approved',
            status: 'available',
            $or: [
              { 'address.city': { $regex: cityRegex } },
              { 'address.city': normalizedCityName }
            ]
          });
          
          // Update the city with the accurate count
          await City.findByIdAndUpdate(
            city._id,
            { properties: propertyCount, updatedAt: new Date() }
          );
          
          console.log(`Updated property count for city ${normalizedCityName} to ${propertyCount}`);
        } else {
          // City doesn't exist, create it with normalized name
          await City.create({
            name: normalizedCityName, // Use normalized city name
            properties: 1,
            image: "/images/cities/default-city.jpg",
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`Created new city ${normalizedCityName} with property count 1`);
        }
      }
    }
  } catch (error) {
    console.error('Error in property post-save hook:', error);
  }
});

// Post-remove hook to update city property count when a property is deleted
PropertySchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;
  
  try {
    // Cast document to our interface
    const property = doc as unknown as IProperty;
    
    // Get the property's city name
    const rawCityName = property.address?.city;
    
    if (rawCityName) {
      // Import city utilities
      const { normalizeCityName, getCityRegex } = require('../lib/utils/city-utils');
      
      // Normalize the city name to proper title case
      const normalizedCityName = normalizeCityName(rawCityName);
      
      // Import City model
      const City = mongoose.models.City || mongoose.model('City', require('./city').default.schema);

      // Find the city by name (case-insensitive with flexible formatting)
      const cityRegex = getCityRegex(normalizedCityName);
      let city = await City.findOne({ name: { $regex: cityRegex } });
      
      // If no city found with flexible regex, try exact match
      if (!city) {
        city = await City.findOne({ name: normalizedCityName });
      }
      
      if (city) {
        // Get updated count of properties in this city using flexible regex
        const propertyCount = await mongoose.model('Property').countDocuments({
          isPublished: true,
          verificationStatus: 'approved',
          status: 'available',
          $or: [
            { 'address.city': { $regex: cityRegex } },
            { 'address.city': normalizedCityName }
          ]
        });
        
        // Update the city with the accurate count
        await City.findByIdAndUpdate(
          city._id,
          { properties: propertyCount, updatedAt: new Date() }
        );
        
        console.log(`Updated property count for city ${normalizedCityName} to ${propertyCount} after property deletion`);
      }
    }
  } catch (error) {
    console.error('Error in property post-remove hook:', error);
  }
});

// Create indexes for faster queries
PropertySchema.index({ location: 'text', 'address.city': 'text', 'address.country': 'text' });
PropertySchema.index({ userId: 1 });
PropertySchema.index({ hostId: 1 });
PropertySchema.index({ isPublished: 1, isAvailable: 1 });
PropertySchema.index({ verificationStatus: 1 });
PropertySchema.index({ 'price.base': 1 });
PropertySchema.index({ rating: -1 });
PropertySchema.index({ city: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ status: 1 });

const Property = mongoose.models.Property as mongoose.Model<IProperty> || 
                 mongoose.model<IProperty>('Property', PropertySchema);

export default Property;
