import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingRoom extends Document {
  bookingId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId; // Specific room if assigned
  roomTypeId: mongoose.Types.ObjectId;
  
  // Room allocation details
  allocation: {
    status: 'pending' | 'allocated' | 'changed' | 'released' | 'blocked';
    allocatedAt?: Date;
    allocatedBy?: mongoose.Types.ObjectId;
    roomNumber?: string;
    floor?: number;
    wing?: string;
    block?: string;
    allocationMethod: 'auto' | 'manual' | 'guest_preference' | 'upgrade';
    allocationNotes?: string;
  };
  
  // Pricing details
  pricing: {
    baseRate: number;
    discountAmount: number;
    discountPercentage: number;
    discountReason?: string;
    taxAmount: number;
    serviceCharges: number;
    totalAmount: number;
    currency: string;
    rateType: 'base' | 'promotional' | 'negotiated' | 'upgrade' | 'last_minute';
    rateSource: 'property' | 'channel' | 'manual' | 'dynamic';
  };
  
  // Dates and duration
  dates: {
    checkIn: Date;
    checkOut: Date;
    nights: number;
    actualCheckIn?: Date;
    actualCheckOut?: Date;
    earlyCheckIn: boolean;
    lateCheckOut: boolean;
    extendedStay: boolean;
  };
  
  // Guest details
  guests: {
    adults: number;
    children: number;
    infants: number;
    totalGuests: number;
    maxOccupancy: number;
    extraGuestCharge?: number;
    guestNames?: string[];
    ages?: number[];
  };
  
  // Room preferences and requests
  preferences: {
    roomPreferences: string[];
    bedType?: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
    smokingRoom: boolean;
    accessibleRoom: boolean;
    connectingRooms: boolean;
    quietArea: boolean;
    highFloor: boolean;
    lowFloor: boolean;
    balcony: boolean;
    view?: string[];
    specialRequests: string[];
  };
  
  // Amenities and services
  amenities: {
    includedAmenities: string[];
    additionalAmenities: [{
      amenityId: string;
      amenityName: string;
      charge: number;
      isOptional: boolean;
      quantity: number;
    }];
    roomServiceOrders: [{
      orderId: string;
      orderTime: Date;
      items: string[];
      totalAmount: number;
      status: 'ordered' | 'preparing' | 'delivered' | 'cancelled';
    }];
  };
  
  // Housekeeping and maintenance
  housekeeping: {
    cleaningSchedule: [{
      date: Date;
      timeSlot: string;
      type: 'standard' | 'deep' | 'checkout' | 'maintenance';
      assignedTo?: mongoose.Types.ObjectId;
      completed: boolean;
      completedAt?: Date;
      issues?: string[];
    }];
    specialInstructions: string[];
    guestPreferences: {
      doNotDisturb: boolean;
      dndTime?: string;
      cleaningTime?: string;
      towelChange: 'daily' | 'on_request' | 'every_other_day';
      bedMaking: boolean;
    };
  };
  
  // Check-in/Check-out process
  checkInOut: {
    checkInProcess: {
      completed: boolean;
      completedAt?: Date;
      completedBy?: mongoose.Types.ObjectId;
      documentsVerified: boolean;
      depositsCollected: number;
      keyCardsIssued: number;
      guestOrientation: boolean;
      checkInNotes?: string;
    };
    checkOutProcess: {
      completed: boolean;
      completedAt?: Date;
      completedBy?: mongoose.Types.ObjectId;
      roomInspected: boolean;
      damagedReported: boolean;
      additionalCharges: number;
      depositsReturned: number;
      keyCardsReturned: number;
      checkOutNotes?: string;
    };
  };
  
  // Billing and charges
  billing: {
    charges: [{
      type: 'room' | 'tax' | 'service' | 'amenity' | 'incidental' | 'penalty' | 'deposit';
      description: string;
      amount: number;
      date: Date;
      isRefundable: boolean;
      includedInRate: boolean;
    }];
    totalCharges: number;
    paidAmount: number;
    balanceAmount: number;
    refundableAmount: number;
    currency: string;
  };
  
  // Communication history
  communications: [{
    type: 'email' | 'phone' | 'sms' | 'whatsapp' | 'in_person' | 'app_notification';
    direction: 'inbound' | 'outbound';
    subject?: string;
    message: string;
    sentBy: mongoose.Types.ObjectId;
    sentTo: string; // Contact method
    sentAt: Date;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
    guestResponse?: string;
    responseAt?: Date;
  }];
  
  // Incident and issue tracking
  incidents: [{
    type: 'complaint' | 'maintenance' | 'noise' | 'damage' | 'theft' | 'medical' | 'security' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    reportedBy: mongoose.Types.ObjectId;
    reportedAt: Date;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    assignedTo?: mongoose.Types.ObjectId;
    resolutionNotes?: string;
    resolvedAt?: Date;
    guestSatisfied?: boolean;
    followUpRequired: boolean;
  }];
  
  // Guest satisfaction and feedback
  feedback: {
    preArrivalSurvey?: {
      completedAt: Date;
      responses: mongoose.Schema.Types.Mixed;
      satisfactionScore: number;
    };
    duringStaySurvey?: {
      completedAt: Date;
      responses: mongoose.Schema.Types.Mixed;
      satisfactionScore: number;
    };
    postStaySurvey?: {
      completedAt: Date;
      responses: mongoose.Schema.Types.Mixed;
      satisfactionScore: number;
      wouldRecommend: boolean;
      publicReview?: {
        rating: number;
        comment: string;
        platform: string;
        publishedAt: Date;
      };
    };
  };
  
  // Revenue management
  revenueData: {
    revenuePotential: number;
    actualRevenue: number;
    opportunityCost: number;
    upsellOpportunities: string[];
    upsellAttempts: number;
    upsellSuccessful: number;
    upsellRevenue: number;
  };
  
  // Channel and booking source
  source: {
    bookingChannel: 'direct' | 'ota' | 'travel_agent' | 'phone' | 'walk_in' | 'group' | 'corporate';
    channelCommission?: number;
    originalBookingReference?: string;
    campaignCode?: string;
    promotionCode?: string;
    referralSource?: string;
  };
  
  // Special arrangements
  specialArrangements: {
    vipTreatment: boolean;
    honeymoonPackage: boolean;
    anniversaryCelebration: boolean;
    businessMeeting: boolean;
    accessibilitySupport: boolean;
    petAccommodation: boolean;
    childcareServices: boolean;
    transportationArranged: boolean;
    specialDietArranged: boolean;
    customArrangements: string[];
  };
  
  // Integration data
  integrations: {
    pmsRoomId?: string;
    channelRoomId?: string;
    keyCardSystemId?: string;
    posSystemId?: string;
    crmGuestId?: string;
    externalReferences: [{
      system: string;
      referenceId: string;
      referenceType: string;
    }];
  };
  
  // Automation and AI insights
  automation: {
    autoUpgradeEligible: boolean;
    autoCheckInEligible: boolean;
    aiRecommendations: string[];
    predictedSatisfactionScore: number;
    churnRisk: 'low' | 'medium' | 'high';
    upsellProbability: number;
  };
  
  // Compliance and security
  compliance: {
    guestRegistrationCompleted: boolean;
    taxIdCollected: boolean;
    securityDeposit: number;
    idVerificationCompleted: boolean;
    sanctionListChecked: boolean;
    dataProtectionConsent: boolean;
    termsAccepted: boolean;
    acceptedAt?: Date;
  };
  
  // Historical changes
  changeHistory: [{
    field: string;
    oldValue: mongoose.Schema.Types.Mixed;
    newValue: mongoose.Schema.Types.Mixed;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
    approvedBy?: mongoose.Types.ObjectId;
  }];
  
  // Status and flags
  status: 'active' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show' | 'extended';
  flags: {
    isPriority: boolean;
    isVip: boolean;
    hasIssues: boolean;
    requiresAttention: boolean;
    isUpgraded: boolean;
    hasSpecialRequests: boolean;
    isGroupBooking: boolean;
    isCorpBooking: boolean;
  };
  
  // Audit fields
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  lastModifiedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const BookingRoomSchema = new Schema<IBookingRoom>({
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'EnhancedBooking', 
    required: true 
  },
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  roomId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Room' 
  },
  roomTypeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'RoomType', 
    required: true 
  },
  
  allocation: {
    status: { 
      type: String, 
      enum: ['pending', 'allocated', 'changed', 'released', 'blocked'],
      default: 'pending' 
    },
    allocatedAt: { type: Date },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    roomNumber: { type: String },
    floor: { type: Number },
    wing: { type: String },
    block: { type: String },
    allocationMethod: { 
      type: String, 
      enum: ['auto', 'manual', 'guest_preference', 'upgrade'],
      default: 'auto' 
    },
    allocationNotes: { type: String }
  },
  
  pricing: {
    baseRate: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountReason: { type: String },
    taxAmount: { type: Number, default: 0, min: 0 },
    serviceCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    rateType: { 
      type: String, 
      enum: ['base', 'promotional', 'negotiated', 'upgrade', 'last_minute'],
      default: 'base' 
    },
    rateSource: { 
      type: String, 
      enum: ['property', 'channel', 'manual', 'dynamic'],
      default: 'property' 
    }
  },
  
  dates: {
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },
    earlyCheckIn: { type: Boolean, default: false },
    lateCheckOut: { type: Boolean, default: false },
    extendedStay: { type: Boolean, default: false }
  },
  
  guests: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    totalGuests: { type: Number, required: true, min: 1 },
    maxOccupancy: { type: Number, required: true, min: 1 },
    extraGuestCharge: { type: Number, min: 0 },
    guestNames: [{ type: String }],
    ages: [{ type: Number, min: 0 }]
  },
  
  preferences: {
    roomPreferences: [{ type: String }],
    bedType: { type: String, enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa_bed'] },
    smokingRoom: { type: Boolean, default: false },
    accessibleRoom: { type: Boolean, default: false },
    connectingRooms: { type: Boolean, default: false },
    quietArea: { type: Boolean, default: false },
    highFloor: { type: Boolean, default: false },
    lowFloor: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    view: [{ type: String }],
    specialRequests: [{ type: String }]
  },
  
  amenities: {
    includedAmenities: [{ type: String }],
    additionalAmenities: [{
      amenityId: { type: String, required: true },
      amenityName: { type: String, required: true },
      charge: { type: Number, required: true, min: 0 },
      isOptional: { type: Boolean, default: true },
      quantity: { type: Number, default: 1, min: 1 }
    }],
    roomServiceOrders: [{
      orderId: { type: String, required: true },
      orderTime: { type: Date, required: true },
      items: [{ type: String }],
      totalAmount: { type: Number, required: true, min: 0 },
      status: { 
        type: String, 
        enum: ['ordered', 'preparing', 'delivered', 'cancelled'],
        default: 'ordered' 
      }
    }]
  },
  
  housekeeping: {
    cleaningSchedule: [{
      date: { type: Date, required: true },
      timeSlot: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['standard', 'deep', 'checkout', 'maintenance'],
        required: true 
      },
      assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      issues: [{ type: String }]
    }],
    specialInstructions: [{ type: String }],
    guestPreferences: {
      doNotDisturb: { type: Boolean, default: false },
      dndTime: { type: String },
      cleaningTime: { type: String },
      towelChange: { 
        type: String, 
        enum: ['daily', 'on_request', 'every_other_day'],
        default: 'daily' 
      },
      bedMaking: { type: Boolean, default: true }
    }
  },
  
  checkInOut: {
    checkInProcess: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      documentsVerified: { type: Boolean, default: false },
      depositsCollected: { type: Number, default: 0, min: 0 },
      keyCardsIssued: { type: Number, default: 0, min: 0 },
      guestOrientation: { type: Boolean, default: false },
      checkInNotes: { type: String }
    },
    checkOutProcess: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      roomInspected: { type: Boolean, default: false },
      damagedReported: { type: Boolean, default: false },
      additionalCharges: { type: Number, default: 0, min: 0 },
      depositsReturned: { type: Number, default: 0, min: 0 },
      keyCardsReturned: { type: Number, default: 0, min: 0 },
      checkOutNotes: { type: String }
    }
  },
  
  billing: {
    charges: [{
      type: { 
        type: String, 
        enum: ['room', 'tax', 'service', 'amenity', 'incidental', 'penalty', 'deposit'],
        required: true 
      },
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      isRefundable: { type: Boolean, default: false },
      includedInRate: { type: Boolean, default: false }
    }],
    totalCharges: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0 },
    refundableAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' }
  },
  
  communications: [{
    type: { 
      type: String, 
      enum: ['email', 'phone', 'sms', 'whatsapp', 'in_person', 'app_notification'],
      required: true 
    },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    subject: { type: String },
    message: { type: String, required: true },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentTo: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    deliveryStatus: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent' 
    },
    guestResponse: { type: String },
    responseAt: { type: Date }
  }],
  
  incidents: [{
    type: { 
      type: String, 
      enum: ['complaint', 'maintenance', 'noise', 'damage', 'theft', 'medical', 'security', 'other'],
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open' 
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    guestSatisfied: { type: Boolean },
    followUpRequired: { type: Boolean, default: false }
  }],
  
  feedback: {
    preArrivalSurvey: {
      completedAt: { type: Date },
      responses: { type: Schema.Types.Mixed },
      satisfactionScore: { type: Number, min: 1, max: 10 }
    },
    duringStaySurvey: {
      completedAt: { type: Date },
      responses: { type: Schema.Types.Mixed },
      satisfactionScore: { type: Number, min: 1, max: 10 }
    },
    postStaySurvey: {
      completedAt: { type: Date },
      responses: { type: Schema.Types.Mixed },
      satisfactionScore: { type: Number, min: 1, max: 10 },
      wouldRecommend: { type: Boolean },
      publicReview: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        platform: { type: String },
        publishedAt: { type: Date }
      }
    }
  },
  
  revenueData: {
    revenuePotential: { type: Number, default: 0, min: 0 },
    actualRevenue: { type: Number, default: 0, min: 0 },
    opportunityCost: { type: Number, default: 0, min: 0 },
    upsellOpportunities: [{ type: String }],
    upsellAttempts: { type: Number, default: 0, min: 0 },
    upsellSuccessful: { type: Number, default: 0, min: 0 },
    upsellRevenue: { type: Number, default: 0, min: 0 }
  },
  
  source: {
    bookingChannel: { 
      type: String, 
      enum: ['direct', 'ota', 'travel_agent', 'phone', 'walk_in', 'group', 'corporate'],
      required: true 
    },
    channelCommission: { type: Number, min: 0 },
    originalBookingReference: { type: String },
    campaignCode: { type: String },
    promotionCode: { type: String },
    referralSource: { type: String }
  },
  
  specialArrangements: {
    vipTreatment: { type: Boolean, default: false },
    honeymoonPackage: { type: Boolean, default: false },
    anniversaryCelebration: { type: Boolean, default: false },
    businessMeeting: { type: Boolean, default: false },
    accessibilitySupport: { type: Boolean, default: false },
    petAccommodation: { type: Boolean, default: false },
    childcareServices: { type: Boolean, default: false },
    transportationArranged: { type: Boolean, default: false },
    specialDietArranged: { type: Boolean, default: false },
    customArrangements: [{ type: String }]
  },
  
  integrations: {
    pmsRoomId: { type: String },
    channelRoomId: { type: String },
    keyCardSystemId: { type: String },
    posSystemId: { type: String },
    crmGuestId: { type: String },
    externalReferences: [{
      system: { type: String, required: true },
      referenceId: { type: String, required: true },
      referenceType: { type: String, required: true }
    }]
  },
  
  automation: {
    autoUpgradeEligible: { type: Boolean, default: false },
    autoCheckInEligible: { type: Boolean, default: false },
    aiRecommendations: [{ type: String }],
    predictedSatisfactionScore: { type: Number, min: 1, max: 10 },
    churnRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    upsellProbability: { type: Number, min: 0, max: 100, default: 0 }
  },
  
  compliance: {
    guestRegistrationCompleted: { type: Boolean, default: false },
    taxIdCollected: { type: Boolean, default: false },
    securityDeposit: { type: Number, default: 0, min: 0 },
    idVerificationCompleted: { type: Boolean, default: false },
    sanctionListChecked: { type: Boolean, default: false },
    dataProtectionConsent: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, default: false },
    acceptedAt: { type: Date }
  },
  
  changeHistory: [{
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  
  status: { 
    type: String, 
    enum: ['active', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'extended'],
    default: 'active' 
  },
  
  flags: {
    isPriority: { type: Boolean, default: false },
    isVip: { type: Boolean, default: false },
    hasIssues: { type: Boolean, default: false },
    requiresAttention: { type: Boolean, default: false },
    isUpgraded: { type: Boolean, default: false },
    hasSpecialRequests: { type: Boolean, default: false },
    isGroupBooking: { type: Boolean, default: false },
    isCorpBooking: { type: Boolean, default: false }
  },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BookingRoomSchema.index({ bookingId: 1 });
BookingRoomSchema.index({ propertyId: 1 });
BookingRoomSchema.index({ roomId: 1 });
BookingRoomSchema.index({ roomTypeId: 1 });
BookingRoomSchema.index({ status: 1 });
BookingRoomSchema.index({ 'dates.checkIn': 1 });
BookingRoomSchema.index({ 'dates.checkOut': 1 });
BookingRoomSchema.index({ 'allocation.status': 1 });

// Compound indexes
BookingRoomSchema.index({ propertyId: 1, status: 1 });
BookingRoomSchema.index({ propertyId: 1, 'dates.checkIn': 1 });
BookingRoomSchema.index({ roomId: 1, 'dates.checkIn': 1, 'dates.checkOut': 1 });
BookingRoomSchema.index({ bookingId: 1, status: 1 });

// Pre-save middleware
BookingRoomSchema.pre('save', function(next) {
  // Calculate total guests
  this.guests.totalGuests = this.guests.adults + this.guests.children;
  
  // Calculate nights
  if (this.dates.checkIn && this.dates.checkOut) {
    const diffTime = this.dates.checkOut.getTime() - this.dates.checkIn.getTime();
    (this as any).nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate total charges
  this.billing.totalCharges = this.billing.charges.reduce((sum, charge) => sum + charge.amount, 0);
  this.billing.balanceAmount = this.billing.totalCharges - this.billing.paidAmount;
  
  // Set flags based on data
  this.flags.hasSpecialRequests = this.preferences.specialRequests.length > 0;
  this.flags.hasIssues = this.incidents.some((incident: any) => ['open', 'investigating'].includes(incident.status));
  this.flags.requiresAttention = this.flags.hasIssues || this.flags.isPriority;
  
  // Update last modified
  this.lastModifiedAt = new Date();
  
  next();
});

// Virtual for stay duration in words
BookingRoomSchema.virtual('stayDuration').get(function() {
  const nights = this.dates.nights;
  if (nights === 1) return '1 night';
  if (nights <= 7) return `${nights} nights (short stay)`;
  if (nights <= 30) return `${nights} nights (medium stay)`;
  return `${nights} nights (long stay)`;
});

// Virtual for revenue per night
BookingRoomSchema.virtual('revenuePerNight').get(function() {
  return this.dates.nights > 0 ? this.pricing.totalAmount / this.dates.nights : 0;
});

// Methods
BookingRoomSchema.methods.allocateRoom = function(roomId: string, allocatedBy: string, notes?: string) {
  this.roomId = roomId;
  this.allocation.status = 'allocated';
  this.allocation.allocatedAt = new Date();
  this.allocation.allocatedBy = allocatedBy;
  this.allocation.allocationNotes = notes;
  return this.save();
};

BookingRoomSchema.methods.checkIn = function(staffId: string, keyCards: number = 1) {
  this.status = 'checked_in';
  this.dates.actualCheckIn = new Date();
  this.checkInOut.checkInProcess.completed = true;
  this.checkInOut.checkInProcess.completedAt = new Date();
  this.checkInOut.checkInProcess.completedBy = staffId;
  this.checkInOut.checkInProcess.keyCardsIssued = keyCards;
  return this.save();
};

BookingRoomSchema.methods.checkOut = function(staffId: string) {
  this.status = 'checked_out';
  this.dates.actualCheckOut = new Date();
  this.checkInOut.checkOutProcess.completed = true;
  this.checkInOut.checkOutProcess.completedAt = new Date();
  this.checkInOut.checkOutProcess.completedBy = staffId;
  return this.save();
};

BookingRoomSchema.methods.addIncident = function(incidentData: any) {
  this.incidents.push(incidentData);
  this.flags.hasIssues = true;
  this.flags.requiresAttention = true;
  return this.save();
};

// Static methods
BookingRoomSchema.statics.getArrivalsToday = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    'dates.checkIn': { $gte: today, $lt: tomorrow },
    status: { $in: ['active', 'checked_in'] }
  }).populate('roomId roomTypeId');
};

BookingRoomSchema.statics.getDeparturesToday = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    'dates.checkOut': { $gte: today, $lt: tomorrow },
    status: { $in: ['active', 'checked_in'] }
  }).populate('roomId roomTypeId');
};

BookingRoomSchema.statics.getInHouseGuests = function(propertyId: string) {
  const today = new Date();
  
  return this.find({
    propertyId,
    status: 'checked_in',
    'dates.checkIn': { $lte: today },
    'dates.checkOut': { $gt: today }
  }).populate('roomId roomTypeId');
};

export default mongoose.models.BookingRoom || mongoose.model<IBookingRoom>('BookingRoom', BookingRoomSchema);