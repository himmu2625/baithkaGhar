import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventBooking extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  bookingNumber: string;

  // Event Details (following user specification)
  eventType: 'wedding' | 'conference' | 'birthday' | 'corporate' | 'exhibition' | 'other';
  eventName: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  expectedGuests: number;

  // Venue (following user specification)
  venueId: Types.ObjectId;
  setupStyle: 'theatre' | 'classroom' | 'u-shape' | 'boardroom' | 'banquet' | 'cocktail';

  // Customer Information (following user specification)
  organizer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    address: any;
  };
  billingContact: {
    name?: string;
    email?: string;
    phone?: string;
    address?: any;
  };

  // Services & Packages (following user specification)
  selectedPackage?: Types.ObjectId;
  services: [{
    serviceId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }];

  // Catering (following user specification)
  cateringRequired: boolean;
  menuId?: Types.ObjectId;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'cocktail' | 'tea-break';
  guestCount: number;

  // Pricing (following user specification)
  venueCharges: number;
  cateringCharges: number;
  serviceCharges: number;
  equipmentCharges: number;
  decorationCharges: number;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  advancePayment: number;
  balanceAmount: number;

  // Status & Timeline (following user specification)
  status: 'inquiry' | 'quoted' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'advance-paid' | 'fully-paid';

  // Staff Assignment (following user specification)
  eventManager?: Types.ObjectId;
  assignedStaff: [{
    staffId: Types.ObjectId;
    role: string;
    startTime: string;
    endTime: string;
  }];

  // Special Requirements (following user specification)
  specialRequests: string;
  equipmentNeeds: string[];
  decorationRequests: string;
  technicalRequirements: string;

  // Legacy comprehensive fields for backward compatibility
  client?: any;
  eventDetails?: any;
  venue?: any;
  services_legacy?: any;
  staffAssignments?: any;
  timeline?: any;
  pricing_legacy?: any;
  payment?: any;
  contract?: any;
  communications?: any;
  requirements?: any;
  eventExecution?: any;
  feedback?: any;
  issues?: any;
  documents?: any;
  modifications?: any;
  priority?: string;
  tags?: string[];
  status_legacy?: string;

  // Metadata
  isActive: boolean;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  assignedCoordinator?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateStatus(newStatus: string, staffMemberId?: string): Promise<IEventBooking>;
  addPayment(paymentData: any): Promise<IEventBooking>;
  addCommunication(communicationData: any, staffMemberId: string): Promise<IEventBooking>;
}

const EventBookingSchema = new Schema<IEventBooking>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },
  
  bookingNumber: {
    type: String,
    required: [true, 'Booking number is required'],
    unique: true,
    trim: true
  },

  // Core fields following user specification
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: {
      values: ['wedding', 'conference', 'birthday', 'corporate', 'exhibition', 'other'],
      message: 'Invalid event type'
    }
  },

  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },

  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },

  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },

  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },

  expectedGuests: {
    type: Number,
    required: [true, 'Expected guests count is required'],
    min: [1, 'Expected guests must be at least 1']
  },

  // Venue
  venueId: {
    type: Schema.Types.ObjectId,
    ref: 'EventVenue',
    required: [true, 'Venue ID is required']
  },

  setupStyle: {
    type: String,
    required: [true, 'Setup style is required'],
    enum: {
      values: ['theatre', 'classroom', 'u-shape', 'boardroom', 'banquet', 'cocktail'],
      message: 'Invalid setup style'
    }
  },

  // Customer Information
  organizer: {
    name: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Organizer email is required'],
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    phone: {
      type: String,
      required: [true, 'Organizer phone is required']
    },
    company: String,
    address: Schema.Types.Mixed
  },

  billingContact: {
    name: String,
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    phone: String,
    address: Schema.Types.Mixed
  },

  // Services & Packages
  selectedPackage: {
    type: Schema.Types.ObjectId,
    ref: 'EventPackage'
  },

  services: [{
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'EventService',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // Catering
  cateringRequired: {
    type: Boolean,
    required: [true, 'Catering requirement status is required'],
    default: false
  },

  menuId: {
    type: Schema.Types.ObjectId,
    ref: 'EventMenu'
  },

  mealType: {
    type: String,
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'cocktail', 'tea-break'],
      message: 'Invalid meal type'
    }
  },

  guestCount: {
    type: Number,
    required: [true, 'Guest count is required'],
    min: [0, 'Guest count cannot be negative']
  },

  // Pricing
  venueCharges: {
    type: Number,
    required: [true, 'Venue charges is required'],
    min: [0, 'Venue charges cannot be negative']
  },

  cateringCharges: {
    type: Number,
    default: 0,
    min: [0, 'Catering charges cannot be negative']
  },

  serviceCharges: {
    type: Number,
    default: 0,
    min: [0, 'Service charges cannot be negative']
  },

  equipmentCharges: {
    type: Number,
    default: 0,
    min: [0, 'Equipment charges cannot be negative']
  },

  decorationCharges: {
    type: Number,
    default: 0,
    min: [0, 'Decoration charges cannot be negative']
  },

  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },

  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },

  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },

  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },

  advancePayment: {
    type: Number,
    default: 0,
    min: [0, 'Advance payment cannot be negative']
  },

  balanceAmount: {
    type: Number,
    required: [true, 'Balance amount is required'],
    min: [0, 'Balance amount cannot be negative']
  },

  // Status & Timeline
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['inquiry', 'quoted', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      message: 'Invalid booking status'
    },
    default: 'inquiry'
  },

  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'advance-paid', 'fully-paid'],
      message: 'Invalid payment status'
    },
    default: 'pending'
  },

  // Staff Assignment
  eventManager: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  assignedStaff: [{
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    }
  }],

  // Special Requirements
  specialRequests: {
    type: String,
    default: '',
    maxlength: [2000, 'Special requests cannot exceed 2000 characters']
  },

  equipmentNeeds: [{
    type: String,
    maxlength: [100, 'Equipment need cannot exceed 100 characters']
  }],

  decorationRequests: {
    type: String,
    default: '',
    maxlength: [1000, 'Decoration requests cannot exceed 1000 characters']
  },

  technicalRequirements: {
    type: String,
    default: '',
    maxlength: [1000, 'Technical requirements cannot exceed 1000 characters']
  },

  // Legacy support for existing comprehensive schema
  client: {
    type: {
      type: String,
      enum: ['individual', 'corporate', 'government', 'ngo', 'repeat_client']
    }
  },
  
  eventDetails: {
    eventName: {
      type: String,
      required: true,
      trim: true
    },
    eventTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'EventType',
      required: true
    },
    eventTypeName: String,
    
    eventDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true // "14:00"
    },
    endTime: {
      type: String,
      required: true // "22:00"
    },
    duration: { type: Number }, // hours, calculated automatically
    
    guestCount: {
      confirmed: { type: Number, required: true },
      expected: { type: Number },
      children: { type: Number, default: 0 },
      vips: { type: Number, default: 0 }
    },
    
    occasion: String,
    theme: String,
    dresscode: String,
    specialRequests: String
  },
  
  venue: {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'EventVenue',
      required: true
    },
    venueName: String,
    
    setup: {
      seatingArrangement: {
        type: String,
        enum: ['theater', 'classroom', 'u_shape', 'boardroom', 'banquet_round', 'cocktail', 'conference', 'cabaret'],
        required: true
      },
      setupTime: Date,
      teardownTime: Date,
      specialSetupRequests: String
    }
  },
  
  services_legacy: {
    catering: {
      required: { type: Boolean, default: true },
      serviceType: {
        type: String,
        enum: ['buffet', 'plated', 'cocktail_style', 'family_style', 'mixed']
      },
      cuisinePreferences: [String],
      menuId: {
        type: Schema.Types.ObjectId,
        ref: 'EventMenu'
      },
      specialDietaryRequirements: [String],
      beverageService: {
        type: String,
        enum: ['non_alcoholic', 'beer_wine', 'full_bar', 'cash_bar', 'premium_bar']
      },
      estimatedCost: Number
    },
    
    decoration: {
      required: { type: Boolean, default: true },
      theme: String,
      colorScheme: [String],
      floralarrangements: String,
      lighting: String,
      specialDecorRequests: String,
      estimatedCost: Number
    },
    
    audioVisual: {
      required: { type: Boolean, default: false },
      equipment: [String],
      technician: { type: Boolean, default: false },
      specialAvRequests: String,
      estimatedCost: Number
    },
    
    photography: {
      required: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['photography', 'videography', 'both']
      },
      duration: Number, // hours
      specialRequests: String,
      estimatedCost: Number
    },
    
    entertainment: {
      required: { type: Boolean, default: false },
      type: String, // "DJ", "Live Band", "Cultural Program"
      duration: Number,
      specialRequests: String,
      estimatedCost: Number
    },
    
    accommodation: {
      required: { type: Boolean, default: false },
      roomsRequired: Number,
      roomType: String,
      checkInDate: Date,
      checkOutDate: Date,
      specialRequests: String,
      estimatedCost: Number
    },
    
    transportation: {
      required: { type: Boolean, default: false },
      pickupLocations: [String],
      vehicleType: String,
      guestCount: Number,
      estimatedCost: Number
    }
  },
  
  staffAssignments: [{
    role: {
      type: String,
      enum: ['event_coordinator', 'manager', 'chef', 'server', 'bartender', 'decorator', 'av_technician', 'security', 'valet'],
      required: true
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    staffName: String,
    isLead: { type: Boolean, default: false },
    workingHours: {
      start: String,
      end: String
    },
    specialInstructions: String
  }],
  
  timeline: {
    inquiryDate: {
      type: Date,
      default: Date.now
    },
    quotationSent: Date,
    bookingConfirmed: Date,
    contractSigned: Date,
    finalConfirmation: Date,
    eventSetupStart: Date,
    eventStart: Date,
    eventEnd: Date,
    cleanup: Date,
    feedbackReceived: Date
  },
  
  pricing_legacy: {
    venueCharges: { type: Number, default: 0 },
    cateringCharges: { type: Number, default: 0 },
    decorationCharges: { type: Number, default: 0 },
    audioVisualCharges: { type: Number, default: 0 },
    photographyCharges: { type: Number, default: 0 },
    entertainmentCharges: { type: Number, default: 0 },
    accommodationCharges: { type: Number, default: 0 },
    transportationCharges: { type: Number, default: 0 },
    staffCharges: { type: Number, default: 0 },
    equipmentCharges: { type: Number, default: 0 },
    miscellaneousCharges: { type: Number, default: 0 },
    
    subtotal: { type: Number, required: true },
    
    discounts: [{
      type: String, // "early_bird", "repeat_client", "bulk_discount"
      description: String,
      amount: Number,
      percentage: Number
    }],
    
    taxes: [{
      name: String,
      rate: Number, // percentage
      amount: Number
    }],
    
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },
  
  payment: {
    paymentTerms: {
      advancePayment: { type: Number, default: 50 }, // percentage
      balancePaymentDays: { type: Number, default: 7 } // days before event
    },
    
    transactions: [{
      transactionId: String,
      amount: Number,
      paymentMethod: {
        type: String,
        enum: ['cash', 'cheque', 'bank_transfer', 'card', 'upi', 'online']
      },
      paymentDate: Date,
      status: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'refunded'],
        default: 'pending'
      },
      reference: String,
      notes: String
    }],
    
    totalPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
      default: 'pending'
    },
    
    refunds: [{
      amount: Number,
      reason: String,
      refundDate: Date,
      refundMethod: String,
      reference: String
    }]
  },
  
  contract: {
    contractSigned: { type: Boolean, default: false },
    contractDate: Date,
    contractDocument: String, // URL to contract document
    termsAccepted: { type: Boolean, default: false },
    
    clauses: {
      cancellationPolicy: String,
      refundPolicy: String,
      forceMAjeurePolicy: String,
      liabilityClause: String,
      additionalTerms: String
    }
  },
  
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'meeting', 'site_visit', 'contract', 'reminder', 'feedback']
    },
    date: Date,
    subject: String,
    description: String,
    attendees: [String],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }
  }],
  
  requirements: {
    special: [String],
    dietary: [String],
    accessibility: [String],
    security: [String],
    logistics: [String],
    technical: [String]
  },
  
  eventExecution: {
    preEventChecklist: [{
      task: String,
      responsible: String,
      deadline: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      },
      completedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      completedDate: Date,
      notes: String
    }],
    
    eventDayTasks: [{
      task: String,
      timeSlot: String,
      responsible: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      },
      notes: String
    }],
    
    postEventTasks: [{
      task: String,
      responsible: String,
      deadline: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      },
      notes: String
    }]
  },
  
  feedback: {
    clientRating: {
      overall: { type: Number, min: 1, max: 5 },
      venue: { type: Number, min: 1, max: 5 },
      catering: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      decoration: { type: Number, min: 1, max: 5 },
      coordination: { type: Number, min: 1, max: 5 }
    },
    
    comments: String,
    suggestions: String,
    wouldRecommend: Boolean,
    wouldBookAgain: Boolean,
    
    testimonial: {
      approved: { type: Boolean, default: false },
      content: String,
      clientName: String,
      usagePermission: { type: Boolean, default: false }
    },
    
    internalNotes: String,
    followUpRequired: { type: Boolean, default: false }
  },
  
  issues: [{
    reportedDate: Date,
    category: {
      type: String,
      enum: ['catering', 'decoration', 'venue', 'service', 'equipment', 'coordination', 'billing', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'serious', 'critical']
    },
    reportedBy: String, // Client or staff
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
      default: 'reported'
    },
    resolution: String,
    resolvedDate: Date,
    clientNotified: { type: Boolean, default: false }
  }],
  
  documents: [{
    documentType: {
      type: String,
      enum: ['quotation', 'contract', 'invoice', 'payment_receipt', 'floor_plan', 'menu', 'timeline', 'other']
    },
    documentName: String,
    url: String,
    uploadDate: Date,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }
  }],
  
  modifications: [{
    modificationDate: Date,
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    reason: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    costImpact: Number, // positive or negative
    clientNotified: { type: Boolean, default: false }
  }],
  
  status_legacy: {
    type: String,
    enum: ['inquiry', 'quotation_sent', 'negotiation', 'confirmed', 'contract_signed', 'planning', 'ready', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'inquiry'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  tags: [String], // For categorization and filtering
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
  },
  
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  assignedCoordinator: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'eventbookings'
});

EventBookingSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate booking number if not provided
  if (!doc.bookingNumber && doc.eventDate) {
    const date = new Date(doc.eventDate);
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.bookingNumber = `EVT${dateStr}${timeStr}`;
  }
  
  // Calculate total pricing using modern fields
  if (doc.venueCharges !== undefined || doc.cateringCharges !== undefined) {
    let subtotal = 0;
    subtotal += doc.venueCharges || 0;
    subtotal += doc.cateringCharges || 0;
    subtotal += doc.serviceCharges || 0;
    subtotal += doc.equipmentCharges || 0;
    subtotal += doc.decorationCharges || 0;
    
    doc.subtotal = subtotal;
    
    let total = subtotal;
    total -= doc.discount || 0;
    total += doc.tax || 0;
    
    doc.totalAmount = Math.round(total);
    doc.balanceAmount = doc.totalAmount - (doc.advancePayment || 0);
  }
});

EventBookingSchema.index({ propertyId: 1, bookingNumber: 1 }, { unique: true });
EventBookingSchema.index({ propertyId: 1, status: 1 });
EventBookingSchema.index({ 'eventDetails.eventDate': 1 });
EventBookingSchema.index({ 'venue.venueId': 1 });
EventBookingSchema.index({ assignedCoordinator: 1 });
EventBookingSchema.index({ createdAt: -1 });

EventBookingSchema.virtual('eventDateTime').get(function() {
  const doc = this as any;
  if (doc.eventDetails?.eventDate && doc.eventDetails?.startTime) {
    const [hours, minutes] = doc.eventDetails.startTime.split(':');
    const dateTime = new Date(doc.eventDetails.eventDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
  } else if (doc.eventDate && doc.startTime) {
    const [hours, minutes] = doc.startTime.split(':');
    const dateTime = new Date(doc.eventDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
  }
  return null;
});

EventBookingSchema.virtual('isUpcoming').get(function() {
  const doc = this as any;
  const eventDate = doc.eventDetails?.eventDate || doc.eventDate;
  if (!eventDate) return false;
  return new Date(eventDate) > new Date();
});

EventBookingSchema.methods.updateStatus = function(newStatus: string, staffMemberId?: string) {
  const doc = this as any;
  doc.status = newStatus;
  if (staffMemberId) {
    doc.lastUpdatedBy = staffMemberId;
  }
  return doc.save();
};

EventBookingSchema.methods.addPayment = function(paymentData: any) {
  const doc = this as any;
  // Update advance payment for modern structure
  doc.advancePayment = (doc.advancePayment || 0) + (paymentData.amount || 0);
  doc.balanceAmount = (doc.totalAmount || 0) - doc.advancePayment;
  
  // Update payment status
  if (doc.balanceAmount <= 0) {
    doc.paymentStatus = 'fully-paid';
  } else if (doc.advancePayment > 0) {
    doc.paymentStatus = 'advance-paid';
  }
  
  return doc.save();
};

EventBookingSchema.methods.addCommunication = function(communicationData: any, staffMemberId: string) {
  const doc = this as any;
  doc.communications = doc.communications || [];
  
  doc.communications.push({
    ...communicationData,
    date: communicationData.date || new Date(),
    recordedBy: staffMemberId
  });
  
  return doc.save();
};

EventBookingSchema.methods.assignStaff = function(role: string, staffId: string, staffName: string, isLead = false) {
  const doc = this as any;
  doc.staffAssignments = doc.staffAssignments || [];
  
  // Remove existing assignment for this role if not lead
  if (!isLead) {
    doc.staffAssignments = doc.staffAssignments.filter((assignment: any) => assignment.role !== role);
  }
  
  doc.staffAssignments.push({
    role,
    staffId,
    staffName,
    isLead
  });
  
  return doc.save();
};

EventBookingSchema.methods.addModification = function(changes: any[], reason: string, modifiedBy: string) {
  const doc = this as any;
  doc.modifications = doc.modifications || [];
  
  doc.modifications.push({
    modificationDate: new Date(),
    modifiedBy,
    changes,
    reason,
    clientNotified: false
  });
  
  return doc.save();
};

EventBookingSchema.methods.reportIssue = function(issueData: any, reportedBy: string) {
  const doc = this as any;
  doc.issues = doc.issues || [];
  
  doc.issues.push({
    ...issueData,
    reportedDate: new Date(),
    reportedBy,
    status: 'reported'
  });
  
  return doc.save();
};

EventBookingSchema.methods.addFeedback = function(ratings: any, comments?: string) {
  const doc = this as any;
  doc.feedback = doc.feedback || {};
  
  doc.feedback.clientRating = ratings;
  if (comments) {
    doc.feedback.comments = comments;
  }
  
  doc.timeline = doc.timeline || {};
  doc.timeline.feedbackReceived = new Date();
  
  return doc.save();
};

EventBookingSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId }).sort({ 'eventDetails.eventDate': -1 });
};

EventBookingSchema.statics.findUpcoming = function(propertyId: string, days = 30) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    propertyId,
    'eventDetails.eventDate': { $gte: now, $lte: futureDate },
    status: { $in: ['confirmed', 'contract_signed', 'planning', 'ready'] }
  }).sort({ 'eventDetails.eventDate': 1 });
};

EventBookingSchema.statics.findByVenue = function(venueId: string, date?: Date) {
  let query: any = { 'venue.venueId': venueId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query['eventDetails.eventDate'] = { $gte: startOfDay, $lte: endOfDay };
  }
  
  return this.find(query).sort({ 'eventDetails.startTime': 1 });
};

EventBookingSchema.statics.findByCoordinator = function(coordinatorId: string) {
  return this.find({ assignedCoordinator: coordinatorId })
    .sort({ 'eventDetails.eventDate': 1 });
};

EventBookingSchema.statics.getRevenueReport = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        'eventDetails.eventDate': { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'in_progress'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$eventDetails.eventDate' },
          month: { $month: '$eventDetails.eventDate' }
        },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        averageGuestCount: { $avg: '$eventDetails.guestCount.confirmed' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

const EventBooking = models.EventBooking || model('EventBooking', EventBookingSchema);

export default EventBooking;