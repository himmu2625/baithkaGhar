import mongoose, { Schema, Document } from 'mongoose';

export interface IEnhancedBooking extends Document {
  // Core booking information
  bookingReference: string; // Unique booking reference
  propertyId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId; // Reference to Guest model
  userId?: mongoose.Types.ObjectId; // User account if registered
  
  // Booking status and workflow
  status: {
    current: string; // Current status code
    history: [{
      status: string;
      timestamp: Date;
      changedBy: mongoose.Types.ObjectId;
      reason?: string;
      notes?: string;
    }];
    workflow: {
      canCancel: boolean;
      canModify: boolean;
      canRefund: boolean;
      requiresApproval: boolean;
      nextActions: string[];
    };
  };
  
  // Booking dates and timing
  dates: {
    bookingDate: Date;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    actualCheckIn?: Date;
    actualCheckOut?: Date;
    modificationDeadline?: Date;
    cancellationDeadline?: Date;
  };
  
  // Guest and party information
  party: {
    leadGuest: {
      name: string;
      email: string;
      phone: string;
    };
    totalGuests: number;
    adults: number;
    children: number;
    infants: number;
    additionalGuests: [{
      name: string;
      age?: number;
      relationship: string;
      specialNeeds?: string[];
    }];
  };
  
  // Room and accommodation details
  accommodation: {
    totalRooms: number;
    rooms: mongoose.Types.ObjectId[]; // References to BookingRoom
    roomTypes: [{
      roomTypeId: mongoose.Types.ObjectId;
      quantity: number;
      guestsPerRoom: number;
    }];
    preferences: {
      floor?: string;
      view?: string[];
      connectingRooms: boolean;
      accessibilityNeeds: string[];
      specialRequests: string[];
    };
  };
  
  // Pricing and financial details
  pricing: {
    breakdown: {
      baseAmount: number;
      taxAmount: number;
      serviceCharges: number;
      discountAmount: number;
      discountPercentage: number;
      additionalCharges: number;
      totalAmount: number;
    };
    currency: string;
    rateType: 'standard' | 'promotional' | 'negotiated' | 'group' | 'corporate';
    inclusions: string[];
    exclusions: string[];
    priceGuarantee: boolean;
    priceValidUntil?: Date;
  };
  
  // Payment information
  payment: {
    status: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded' | 'disputed';
    method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'cash' | 'corporate_billing';
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    transactions: [{
      type: 'payment' | 'refund' | 'chargeback' | 'dispute';
      amount: number;
      currency: string;
      transactionId: string;
      gateway: string;
      timestamp: Date;
      status: 'pending' | 'completed' | 'failed' | 'cancelled';
      reference?: string;
      notes?: string;
    }];
    billingAddress?: {
      name: string;
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  
  // Booking source and channel
  source: {
    channel: 'direct' | 'website' | 'mobile_app' | 'phone' | 'email' | 'walk_in' | 'ota' | 'travel_agent' | 'corporate' | 'group';
    subChannel?: string;
    referralCode?: string;
    campaignCode?: string;
    affiliateId?: mongoose.Types.ObjectId;
    originalBookingRef?: string; // For channel bookings
    deviceInfo?: {
      type: 'mobile' | 'tablet' | 'desktop';
      os: string;
      browser: string;
      ipAddress: string;
      location?: string;
    };
  };
  
  // Promotions and discounts
  promotions: {
    coupons: [{
      code: string;
      discount: number;
      type: 'percentage' | 'fixed';
      appliedAt: Date;
    }];
    loyaltyDiscount?: {
      tierLevel: string;
      pointsUsed: number;
      discountAmount: number;
    };
    seasonalOffers: [{
      offerName: string;
      discountAmount: number;
      validFrom: Date;
      validTo: Date;
    }];
    groupDiscount?: {
      groupSize: number;
      discountPercentage: number;
    };
  };
  
  // Services and add-ons
  services: {
    mealPlan?: {
      type: 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
      guestCount: number;
      totalCost: number;
    };
    transportation: {
      airportPickup: boolean;
      airportDrop: boolean;
      localTransport: boolean;
      cost: number;
      vehicleType?: string;
      specialInstructions?: string;
    };
    experiences: [{
      experienceId: string;
      name: string;
      date: Date;
      participants: number;
      cost: number;
      status: 'booked' | 'confirmed' | 'cancelled';
    }];
    additionalServices: [{
      serviceId: string;
      serviceName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      date?: Date;
    }];
  };
  
  // Communication and notifications
  communications: {
    preferredLanguage: string;
    communicationPreferences: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      phone: boolean;
    };
    notifications: [{
      type: 'confirmation' | 'reminder' | 'modification' | 'cancellation' | 'marketing';
      channel: 'email' | 'sms' | 'whatsapp' | 'app_push';
      template: string;
      sentAt: Date;
      deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
      response?: string;
    }];
    correspondenceLog: [{
      direction: 'inbound' | 'outbound';
      channel: 'email' | 'phone' | 'chat' | 'in_person';
      subject?: string;
      summary: string;
      handledBy: mongoose.Types.ObjectId;
      timestamp: Date;
      followUpRequired: boolean;
    }];
  };
  
  // Special arrangements and requirements
  specialArrangements: {
    occasion?: 'honeymoon' | 'anniversary' | 'birthday' | 'business' | 'medical' | 'other';
    dietaryRequirements: string[];
    accessibilityNeeds: string[];
    medicalConditions: string[];
    allergies: string[];
    petDetails?: {
      petType: string;
      petName: string;
      breed: string;
      weight: number;
      medicalInfo?: string;
    };
    childcareNeeds: [{
      childAge: number;
      serviceType: string;
      hours: string;
      cost: number;
    }];
    businessFacilities: string[];
    customRequests: string[];
  };
  
  // Group and corporate booking details
  groupBooking?: {
    isGroupBooking: boolean;
    groupName: string;
    groupSize: number;
    groupType: 'leisure' | 'business' | 'event' | 'wedding' | 'conference';
    groupLeader: {
      name: string;
      email: string;
      phone: string;
      company?: string;
    };
    roomingList: [{
      guestName: string;
      roomNumber?: string;
      checkIn: Date;
      checkOut: Date;
      specialRequests?: string;
    }];
    contractDetails?: {
      contractNumber: string;
      signedDate: Date;
      terms: string;
      paymentTerms: string;
    };
  };
  
  // Loyalty and membership
  loyalty: {
    memberId?: string;
    membershipTier?: string;
    pointsEarned: number;
    pointsRedeemed: number;
    benefitsApplied: string[];
    upgradeEligible: boolean;
    lifetimeValue: number;
  };
  
  // Revenue management and analytics
  revenue: {
    revenuePotential: number;
    actualRevenue: number;
    profitMargin: number;
    costOfSale: number;
    channelCost: number;
    netRevenue: number;
    yieldScore: number;
    competitorRate?: number;
    marketPosition: number;
  };
  
  // Risk assessment and fraud detection
  risk: {
    riskScore: number; // 1-100
    riskFactors: string[];
    fraudIndicators: string[];
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'flagged';
    verificationMethod: string[];
    paymentRisk: number;
    behaviorAnalysis: {
      bookingPattern: string;
      deviceFingerprint: string;
      locationConsistency: boolean;
      velocityChecks: boolean;
    };
  };
  
  // Integration and external systems
  integrations: {
    pmsBookingId?: string;
    channelBookingId?: string;
    crmGuestId?: string;
    accountingReference?: string;
    inventorySystemId?: string;
    revenueSystemId?: string;
    externalReferences: [{
      system: string;
      referenceId: string;
      referenceType: string;
      lastSync: Date;
    }];
    syncStatus: {
      lastSyncAttempt: Date;
      lastSuccessfulSync: Date;
      syncErrors: string[];
      pendingUpdates: string[];
    };
  };
  
  // Quality assurance and reviews
  quality: {
    preArrivalScore?: number;
    stayExperienceScore?: number;
    postStayScore?: number;
    overallSatisfaction?: number;
    reviewsProvided: [{
      platform: string;
      rating: number;
      comment: string;
      reviewDate: Date;
      responseProvided: boolean;
    }];
    qualityIssues: [{
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reportedAt: Date;
      resolvedAt?: Date;
      resolutionNotes?: string;
    }];
  };
  
  // Operational notes and internal communication
  operations: {
    internalNotes: [{
      note: string;
      category: 'general' | 'housekeeping' | 'maintenance' | 'guest_services' | 'management';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      addedBy: mongoose.Types.ObjectId;
      addedAt: Date;
      isPrivate: boolean;
    }];
    alerts: [{
      type: 'vip' | 'complaint' | 'medical' | 'security' | 'operational';
      message: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      isActive: boolean;
      expiresAt?: Date;
    }];
    flags: {
      isVip: boolean;
      hasComplaints: boolean;
      requiresSpecialAttention: boolean;
      hasAccessibilityNeeds: boolean;
      isRepeatGuest: boolean;
      isInfluencer: boolean;
      isCorporateGuest: boolean;
    };
  };
  
  // Cancellation and modification details
  modifications: {
    history: [{
      modificationType: 'dates' | 'rooms' | 'guests' | 'services' | 'pricing';
      oldValue: mongoose.Schema.Types.Mixed;
      newValue: mongoose.Schema.Types.Mixed;
      modifiedBy: mongoose.Types.ObjectId;
      modifiedAt: Date;
      reason: string;
      additionalCost: number;
      refundAmount: number;
      approvedBy?: mongoose.Types.ObjectId;
    }];
    cancellation?: {
      cancelledAt: Date;
      cancelledBy: mongoose.Types.ObjectId;
      cancellationReason: string;
      refundPolicy: string;
      refundAmount: number;
      retentionAttempts: number;
      alternativeOffered: boolean;
      guestSatisfaction?: number;
    };
  };
  
  // Compliance and legal
  compliance: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    termsAccepted: boolean;
    privacyPolicyAccepted: boolean;
    ageVerification: boolean;
    guestRegistration: {
      completed: boolean;
      registrationNumber?: string;
      registeredAt?: Date;
      expiresAt?: Date;
    };
    taxCompliance: {
      taxExempt: boolean;
      exemptionReason?: string;
      taxId?: string;
      invoiceRequired: boolean;
    };
  };
  
  // Performance metrics
  metrics: {
    bookingLeadTime: number; // Days between booking and check-in
    conversionSource: string;
    priceShoppingBehavior: string;
    decisionFactors: string[];
    customerLifetimeValue: number;
    referralPotential: number;
    upsellSuccess: number;
    crossSellSuccess: number;
  };
  
  // Audit and security
  audit: {
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    securityEvents: [{
      eventType: string;
      description: string;
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }];
    dataAccess: [{
      accessedBy: mongoose.Types.ObjectId;
      accessTime: Date;
      accessType: 'view' | 'edit' | 'delete' | 'export';
      ipAddress: string;
    }];
  };
  
  // System fields
  isActive: boolean;
  isTestBooking: boolean;
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const EnhancedBookingSchema = new Schema<IEnhancedBooking>({
  bookingReference: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  guestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Guest', 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  status: {
    current: { type: String, required: true, default: 'PEND' },
    history: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reason: { type: String },
      notes: { type: String }
    }],
    workflow: {
      canCancel: { type: Boolean, default: true },
      canModify: { type: Boolean, default: true },
      canRefund: { type: Boolean, default: false },
      requiresApproval: { type: Boolean, default: false },
      nextActions: [{ type: String }]
    }
  },
  
  dates: {
    bookingDate: { type: Date, default: Date.now },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },
    modificationDeadline: { type: Date },
    cancellationDeadline: { type: Date }
  },
  
  party: {
    leadGuest: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    totalGuests: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    additionalGuests: [{
      name: { type: String, required: true },
      age: { type: Number, min: 0 },
      relationship: { type: String, required: true },
      specialNeeds: [{ type: String }]
    }]
  },
  
  accommodation: {
    totalRooms: { type: Number, required: true, min: 1 },
    rooms: [{ type: Schema.Types.ObjectId, ref: 'BookingRoom' }],
    roomTypes: [{
      roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
      quantity: { type: Number, required: true, min: 1 },
      guestsPerRoom: { type: Number, required: true, min: 1 }
    }],
    preferences: {
      floor: { type: String },
      view: [{ type: String }],
      connectingRooms: { type: Boolean, default: false },
      accessibilityNeeds: [{ type: String }],
      specialRequests: [{ type: String }]
    }
  },
  
  pricing: {
    breakdown: {
      baseAmount: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      serviceCharges: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
      additionalCharges: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 }
    },
    currency: { type: String, default: 'INR' },
    rateType: { 
      type: String, 
      enum: ['standard', 'promotional', 'negotiated', 'group', 'corporate'],
      default: 'standard' 
    },
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    priceGuarantee: { type: Boolean, default: false },
    priceValidUntil: { type: Date }
  },
  
  payment: {
    status: { 
      type: String, 
      enum: ['pending', 'partial', 'paid', 'failed', 'refunded', 'disputed'],
      default: 'pending' 
    },
    method: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash', 'corporate_billing'],
      required: true 
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    transactions: [{
      type: { 
        type: String, 
        enum: ['payment', 'refund', 'chargeback', 'dispute'],
        required: true 
      },
      amount: { type: Number, required: true },
      currency: { type: String, required: true },
      transactionId: { type: String, required: true },
      gateway: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        required: true 
      },
      reference: { type: String },
      notes: { type: String }
    }],
    billingAddress: {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String }
    }
  },
  
  source: {
    channel: { 
      type: String, 
      enum: ['direct', 'website', 'mobile_app', 'phone', 'email', 'walk_in', 'ota', 'travel_agent', 'corporate', 'group'],
      required: true 
    },
    subChannel: { type: String },
    referralCode: { type: String },
    campaignCode: { type: String },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate' },
    originalBookingRef: { type: String },
    deviceInfo: {
      type: { type: String, enum: ['mobile', 'tablet', 'desktop'] },
      os: { type: String },
      browser: { type: String },
      ipAddress: { type: String },
      location: { type: String }
    }
  },
  
  promotions: {
    coupons: [{
      code: { type: String, required: true },
      discount: { type: Number, required: true, min: 0 },
      type: { type: String, enum: ['percentage', 'fixed'], required: true },
      appliedAt: { type: Date, default: Date.now }
    }],
    loyaltyDiscount: {
      tierLevel: { type: String },
      pointsUsed: { type: Number, min: 0 },
      discountAmount: { type: Number, min: 0 }
    },
    seasonalOffers: [{
      offerName: { type: String, required: true },
      discountAmount: { type: Number, required: true, min: 0 },
      validFrom: { type: Date, required: true },
      validTo: { type: Date, required: true }
    }],
    groupDiscount: {
      groupSize: { type: Number, min: 2 },
      discountPercentage: { type: Number, min: 0, max: 100 }
    }
  },
  
  services: {
    mealPlan: {
      type: { type: String, enum: ['breakfast', 'half_board', 'full_board', 'all_inclusive'] },
      guestCount: { type: Number, min: 1 },
      totalCost: { type: Number, min: 0 }
    },
    transportation: {
      airportPickup: { type: Boolean, default: false },
      airportDrop: { type: Boolean, default: false },
      localTransport: { type: Boolean, default: false },
      cost: { type: Number, default: 0, min: 0 },
      vehicleType: { type: String },
      specialInstructions: { type: String }
    },
    experiences: [{
      experienceId: { type: String, required: true },
      name: { type: String, required: true },
      date: { type: Date, required: true },
      participants: { type: Number, required: true, min: 1 },
      cost: { type: Number, required: true, min: 0 },
      status: { 
        type: String, 
        enum: ['booked', 'confirmed', 'cancelled'],
        default: 'booked' 
      }
    }],
    additionalServices: [{
      serviceId: { type: String, required: true },
      serviceName: { type: String, required: true },
      quantity: { type: Number, default: 1, min: 1 },
      unitCost: { type: Number, required: true, min: 0 },
      totalCost: { type: Number, required: true, min: 0 },
      date: { type: Date }
    }]
  },
  
  communications: {
    preferredLanguage: { type: String, default: 'English' },
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      phone: { type: Boolean, default: false }
    },
    notifications: [{
      type: { 
        type: String, 
        enum: ['confirmation', 'reminder', 'modification', 'cancellation', 'marketing'],
        required: true 
      },
      channel: { 
        type: String, 
        enum: ['email', 'sms', 'whatsapp', 'app_push'],
        required: true 
      },
      template: { type: String, required: true },
      sentAt: { type: Date, default: Date.now },
      deliveryStatus: { 
        type: String, 
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent' 
      },
      response: { type: String }
    }],
    correspondenceLog: [{
      direction: { type: String, enum: ['inbound', 'outbound'], required: true },
      channel: { type: String, enum: ['email', 'phone', 'chat', 'in_person'], required: true },
      subject: { type: String },
      summary: { type: String, required: true },
      handledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, default: Date.now },
      followUpRequired: { type: Boolean, default: false }
    }]
  },
  
  specialArrangements: {
    occasion: { 
      type: String, 
      enum: ['honeymoon', 'anniversary', 'birthday', 'business', 'medical', 'other'] 
    },
    dietaryRequirements: [{ type: String }],
    accessibilityNeeds: [{ type: String }],
    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    petDetails: {
      petType: { type: String },
      petName: { type: String },
      breed: { type: String },
      weight: { type: Number, min: 0 },
      medicalInfo: { type: String }
    },
    childcareNeeds: [{
      childAge: { type: Number, required: true, min: 0 },
      serviceType: { type: String, required: true },
      hours: { type: String, required: true },
      cost: { type: Number, required: true, min: 0 }
    }],
    businessFacilities: [{ type: String }],
    customRequests: [{ type: String }]
  },
  
  groupBooking: {
    isGroupBooking: { type: Boolean, default: false },
    groupName: { type: String },
    groupSize: { type: Number, min: 2 },
    groupType: { 
      type: String, 
      enum: ['leisure', 'business', 'event', 'wedding', 'conference'] 
    },
    groupLeader: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      company: { type: String }
    },
    roomingList: [{
      guestName: { type: String, required: true },
      roomNumber: { type: String },
      checkIn: { type: Date, required: true },
      checkOut: { type: Date, required: true },
      specialRequests: { type: String }
    }],
    contractDetails: {
      contractNumber: { type: String },
      signedDate: { type: Date },
      terms: { type: String },
      paymentTerms: { type: String }
    }
  },
  
  loyalty: {
    memberId: { type: String },
    membershipTier: { type: String },
    pointsEarned: { type: Number, default: 0, min: 0 },
    pointsRedeemed: { type: Number, default: 0, min: 0 },
    benefitsApplied: [{ type: String }],
    upgradeEligible: { type: Boolean, default: false },
    lifetimeValue: { type: Number, default: 0, min: 0 }
  },
  
  revenue: {
    revenuePotential: { type: Number, default: 0, min: 0 },
    actualRevenue: { type: Number, default: 0, min: 0 },
    profitMargin: { type: Number, default: 0 },
    costOfSale: { type: Number, default: 0, min: 0 },
    channelCost: { type: Number, default: 0, min: 0 },
    netRevenue: { type: Number, default: 0 },
    yieldScore: { type: Number, default: 50, min: 0, max: 100 },
    competitorRate: { type: Number, min: 0 },
    marketPosition: { type: Number, default: 50, min: 0, max: 100 }
  },
  
  risk: {
    riskScore: { type: Number, default: 50, min: 1, max: 100 },
    riskFactors: [{ type: String }],
    fraudIndicators: [{ type: String }],
    verificationStatus: { 
      type: String, 
      enum: ['unverified', 'pending', 'verified', 'flagged'],
      default: 'unverified' 
    },
    verificationMethod: [{ type: String }],
    paymentRisk: { type: Number, default: 50, min: 1, max: 100 },
    behaviorAnalysis: {
      bookingPattern: { type: String },
      deviceFingerprint: { type: String },
      locationConsistency: { type: Boolean, default: true },
      velocityChecks: { type: Boolean, default: true }
    }
  },
  
  integrations: {
    pmsBookingId: { type: String },
    channelBookingId: { type: String },
    crmGuestId: { type: String },
    accountingReference: { type: String },
    inventorySystemId: { type: String },
    revenueSystemId: { type: String },
    externalReferences: [{
      system: { type: String, required: true },
      referenceId: { type: String, required: true },
      referenceType: { type: String, required: true },
      lastSync: { type: Date, default: Date.now }
    }],
    syncStatus: {
      lastSyncAttempt: { type: Date, default: Date.now },
      lastSuccessfulSync: { type: Date },
      syncErrors: [{ type: String }],
      pendingUpdates: [{ type: String }]
    }
  },
  
  quality: {
    preArrivalScore: { type: Number, min: 1, max: 10 },
    stayExperienceScore: { type: Number, min: 1, max: 10 },
    postStayScore: { type: Number, min: 1, max: 10 },
    overallSatisfaction: { type: Number, min: 1, max: 10 },
    reviewsProvided: [{
      platform: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      reviewDate: { type: Date, required: true },
      responseProvided: { type: Boolean, default: false }
    }],
    qualityIssues: [{
      category: { type: String, required: true },
      description: { type: String, required: true },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        required: true 
      },
      reportedAt: { type: Date, default: Date.now },
      resolvedAt: { type: Date },
      resolutionNotes: { type: String }
    }]
  },
  
  operations: {
    internalNotes: [{
      note: { type: String, required: true },
      category: { 
        type: String, 
        enum: ['general', 'housekeeping', 'maintenance', 'guest_services', 'management'],
        required: true 
      },
      priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium' 
      },
      addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      addedAt: { type: Date, default: Date.now },
      isPrivate: { type: Boolean, default: false }
    }],
    alerts: [{
      type: { 
        type: String, 
        enum: ['vip', 'complaint', 'medical', 'security', 'operational'],
        required: true 
      },
      message: { type: String, required: true },
      priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        required: true 
      },
      isActive: { type: Boolean, default: true },
      expiresAt: { type: Date }
    }],
    flags: {
      isVip: { type: Boolean, default: false },
      hasComplaints: { type: Boolean, default: false },
      requiresSpecialAttention: { type: Boolean, default: false },
      hasAccessibilityNeeds: { type: Boolean, default: false },
      isRepeatGuest: { type: Boolean, default: false },
      isInfluencer: { type: Boolean, default: false },
      isCorporateGuest: { type: Boolean, default: false }
    }
  },
  
  modifications: {
    history: [{
      modificationType: { 
        type: String, 
        enum: ['dates', 'rooms', 'guests', 'services', 'pricing'],
        required: true 
      },
      oldValue: { type: Schema.Types.Mixed },
      newValue: { type: Schema.Types.Mixed },
      modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      modifiedAt: { type: Date, default: Date.now },
      reason: { type: String, required: true },
      additionalCost: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
      cancellationReason: { type: String },
      refundPolicy: { type: String },
      refundAmount: { type: Number, min: 0 },
      retentionAttempts: { type: Number, default: 0, min: 0 },
      alternativeOffered: { type: Boolean, default: false },
      guestSatisfaction: { type: Number, min: 1, max: 5 }
    }
  },
  
  compliance: {
    dataProcessingConsent: { type: Boolean, required: true },
    marketingConsent: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, required: true },
    privacyPolicyAccepted: { type: Boolean, required: true },
    ageVerification: { type: Boolean, default: true },
    guestRegistration: {
      completed: { type: Boolean, default: false },
      registrationNumber: { type: String },
      registeredAt: { type: Date },
      expiresAt: { type: Date }
    },
    taxCompliance: {
      taxExempt: { type: Boolean, default: false },
      exemptionReason: { type: String },
      taxId: { type: String },
      invoiceRequired: { type: Boolean, default: false }
    }
  },
  
  metrics: {
    bookingLeadTime: { type: Number, default: 0, min: 0 },
    conversionSource: { type: String },
    priceShoppingBehavior: { type: String },
    decisionFactors: [{ type: String }],
    customerLifetimeValue: { type: Number, default: 0, min: 0 },
    referralPotential: { type: Number, default: 0, min: 0, max: 100 },
    upsellSuccess: { type: Number, default: 0, min: 0 },
    crossSellSuccess: { type: Number, default: 0, min: 0 }
  },
  
  audit: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    securityEvents: [{
      eventType: { type: String, required: true },
      description: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      ipAddress: { type: String, required: true },
      userAgent: { type: String },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low' 
      }
    }],
    dataAccess: [{
      accessedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      accessTime: { type: Date, default: Date.now },
      accessType: { 
        type: String, 
        enum: ['view', 'edit', 'delete', 'export'],
        required: true 
      },
      ipAddress: { type: String, required: true }
    }]
  },
  
  isActive: { type: Boolean, default: true },
  isTestBooking: { type: Boolean, default: false },
  version: { type: Number, default: 1, min: 1 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
EnhancedBookingSchema.index({ bookingReference: 1 });
EnhancedBookingSchema.index({ propertyId: 1 });
EnhancedBookingSchema.index({ guestId: 1 });
EnhancedBookingSchema.index({ 'status.current': 1 });
EnhancedBookingSchema.index({ 'dates.checkIn': 1 });
EnhancedBookingSchema.index({ 'dates.checkOut': 1 });
EnhancedBookingSchema.index({ 'payment.status': 1 });
EnhancedBookingSchema.index({ 'source.channel': 1 });

// Compound indexes
EnhancedBookingSchema.index({ propertyId: 1, 'status.current': 1 });
EnhancedBookingSchema.index({ propertyId: 1, 'dates.checkIn': 1 });
EnhancedBookingSchema.index({ guestId: 1, 'dates.checkIn': -1 });
EnhancedBookingSchema.index({ 'dates.checkIn': 1, 'dates.checkOut': 1 });

// Text search
EnhancedBookingSchema.index({ 
  bookingReference: 'text',
  'party.leadGuest.name': 'text',
  'party.leadGuest.email': 'text'
});

// Pre-save middleware
EnhancedBookingSchema.pre('save', function(next) {
  // Calculate nights
  if (this.dates.checkIn && this.dates.checkOut) {
    const diffTime = this.dates.checkOut.getTime() - this.dates.checkIn.getTime();
    this.dates.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate total guests
  this.party.totalGuests = this.party.adults + this.party.children + this.party.infants;
  
  // Calculate pending payment amount
  this.payment.pendingAmount = this.pricing.breakdown.totalAmount - this.payment.paidAmount - this.payment.refundedAmount;
  
  // Calculate net revenue
  this.revenue.netRevenue = this.revenue.actualRevenue - this.revenue.costOfSale - this.revenue.channelCost;
  
  // Set flags based on data
  this.operations.flags.hasAccessibilityNeeds = this.specialArrangements.accessibilityNeeds.length > 0;
  this.operations.flags.requiresSpecialAttention = 
    this.specialArrangements.medicalConditions.length > 0 || 
    this.risk.riskScore > 70 ||
    this.operations.flags.isVip;
  
  // Update version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Generate unique booking reference
EnhancedBookingSchema.statics.generateBookingReference = async function() {
  const prefix = 'BG'; // Baithaka Ghar
  const year = new Date().getFullYear().toString().slice(-2);
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let reference = `${prefix}${year}${randomString}`;
  
  // Ensure uniqueness
  let existing = await this.findOne({ bookingReference: reference });
  while (existing) {
    const newRandomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    reference = `${prefix}${year}${newRandomString}`;
    existing = await this.findOne({ bookingReference: reference });
  }
  
  return reference;
};

// Virtual for booking status display
EnhancedBookingSchema.virtual('statusDisplay').get(function() {
  // This would typically fetch from BookingStatus model
  return this.status.current;
});

// Virtual for is upcoming
EnhancedBookingSchema.virtual('isUpcoming').get(function() {
  return this.dates.checkIn > new Date() && ['CONF', 'PEND'].includes(this.status.current);
});

// Methods
EnhancedBookingSchema.methods.updateStatus = function(newStatus: string, changedBy: string, reason?: string, notes?: string) {
  this.status.history.push({
    status: this.status.current,
    timestamp: new Date(),
    changedBy,
    reason,
    notes
  });
  this.status.current = newStatus;
  this.audit.lastModifiedBy = changedBy;
  return this.save();
};

EnhancedBookingSchema.methods.addPayment = function(paymentData: any) {
  this.payment.transactions.push(paymentData);
  if (paymentData.status === 'completed') {
    this.payment.paidAmount += paymentData.amount;
    if (this.payment.paidAmount >= this.pricing.breakdown.totalAmount) {
      this.payment.status = 'paid';
    } else {
      this.payment.status = 'partial';
    }
  }
  return this.save();
};

// Static methods
EnhancedBookingSchema.statics.getArrivalsToday = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    'dates.checkIn': { $gte: today, $lt: tomorrow },
    'status.current': { $in: ['CONF', 'CHKD'] }
  }).populate('guestId accommodation.rooms');
};

EnhancedBookingSchema.statics.getDeparturesToday = function(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    propertyId,
    'dates.checkOut': { $gte: today, $lt: tomorrow },
    'status.current': { $in: ['CONF', 'CHKD'] }
  }).populate('guestId accommodation.rooms');
};

export default mongoose.models.EnhancedBooking || mongoose.model<IEnhancedBooking>('EnhancedBooking', EnhancedBookingSchema);