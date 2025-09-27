import mongoose, { Schema, Document, Types, models, model } from 'mongoose';

export interface IEventCheckin extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  eventBookingId: Types.ObjectId;
  checkinNumber: string;

  // Event Information
  eventDetails: {
    eventName: string;
    eventDate: Date;
    venueId: Types.ObjectId;
    venueName: string;
    expectedGuests: number;
  };

  // Check-in Configuration
  checkinConfig: {
    checkinStartTime: Date;
    checkinEndTime: Date;
    allowEarlyCheckin: boolean;
    earlyCheckinMinutes: number;
    requireIdVerification: boolean;
    allowGuestAdditions: boolean;
    maxGuestAdditions: number;
    qrCodeEnabled: boolean;
    manualCheckinEnabled: boolean;
  };

  // Guest List & Check-ins
  guestList: [{
    guestId?: Types.ObjectId;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    guestType: 'primary' | 'plus-one' | 'vip' | 'staff' | 'vendor' | 'media';
    tableNumber?: string;
    seatNumber?: string;
    mealPreference?: string;
    specialRequirements?: string[];
    dietaryRestrictions?: string[];
    
    // Check-in Status
    checkinStatus: 'pending' | 'checked-in' | 'no-show' | 'cancelled';
    checkinTime?: Date;
    checkinMethod: 'qr-code' | 'manual' | 'self-service' | 'mobile-app';
    checkedInBy?: Types.ObjectId;
    checkinLocation?: string;
    
    // Additional guests (for plus-ones)
    additionalGuests?: [{
      name: string;
      relation?: string;
      checkinTime?: Date;
    }];
    
    // Check-in Notes
    checkinNotes?: string;
    issues?: string[];
  }];

  // Real-time Stats
  checkinStats: {
    totalExpected: number;
    totalCheckedIn: number;
    totalNoShows: number;
    checkinRate: number;
    peakCheckinTime?: Date;
    averageCheckinDuration: number; // seconds
    
    // By guest type
    vipCheckedIn: number;
    regularCheckedIn: number;
    staffCheckedIn: number;
    
    // By time slots
    earlyCheckins: number;
    onTimeCheckins: number;
    lateCheckins: number;
  };

  // Check-in Sessions (for multiple entry points)
  checkinSessions: [{
    sessionId: string;
    location: string;
    staffMemberId: Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    deviceInfo?: string;
    guestsProcessed: number;
    averageProcessingTime: number; // seconds
    issues: [{
      time: Date;
      description: string;
      resolution?: string;
      severity: 'low' | 'medium' | 'high';
    }];
  }];

  // QR Code Management
  qrCodes: [{
    guestId?: Types.ObjectId;
    qrCodeData: string;
    qrCodeUrl: string;
    generatedAt: Date;
    sentAt?: Date;
    scannedAt?: Date;
    scannedBy?: Types.ObjectId;
    isActive: boolean;
    expiryDate?: Date;
  }];

  // Integration with external systems
  integrations: {
    smsNotifications: {
      enabled: boolean;
      remindersSent: number;
      confirmationsSent: number;
    };
    emailNotifications: {
      enabled: boolean;
      invitationsSent: number;
      remindersSent: number;
    };
    mobileApp: {
      enabled: boolean;
      appDownloads: number;
      appCheckins: number;
    };
  };

  // Security & Access Control
  security: {
    accessControlEnabled: boolean;
    securityCheckpoints: [{
      checkpointName: string;
      location: string;
      staffMemberId?: Types.ObjectId;
      guestsProcessed: number;
      flaggedGuests: number;
      issues: [{
        time: Date;
        guestName: string;
        issue: string;
        resolution: string;
      }];
    }];
    bannedGuests: [{
      guestName: string;
      reason: string;
      bannedBy: Types.ObjectId;
      bannedDate: Date;
    }];
  };

  // Real-time Updates & Notifications
  notifications: [{
    type: 'guest-arrival' | 'vip-arrival' | 'issue-reported' | 'capacity-warning' | 'system-alert';
    message: string;
    timestamp: Date;
    recipients: Types.ObjectId[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    sent: boolean;
    acknowledged: [{
      staffMemberId: Types.ObjectId;
      acknowledgedAt: Date;
    }];
  }];

  // Event Timeline Updates
  timelineUpdates: [{
    timestamp: Date;
    event: string;
    description: string;
    category: 'checkin' | 'security' | 'capacity' | 'vip' | 'issue' | 'milestone';
    metadata?: any;
  }];

  // Reporting & Analytics
  analytics: {
    checkinFlow: [{
      timeSlot: string; // "HH:MM"
      guestsCheckedIn: number;
      averageWaitTime: number;
      peakLoad: boolean;
    }];
    issuesSummary: [{
      issueType: string;
      count: number;
      averageResolutionTime: number;
    }];
    guestSatisfaction: {
      totalResponses: number;
      averageRating: number;
      feedbackComments: string[];
    };
  };

  // Status & Metadata
  status: 'setup' | 'active' | 'paused' | 'completed' | 'cancelled';
  isActive: boolean;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  checkInGuest(guestId: string, checkinData: any): Promise<IEventCheckin>;
  generateQRCodes(): Promise<void>;
  sendNotifications(type: string, message: string): Promise<void>;
  updateStats(): Promise<void>;
  exportGuestList(): Promise<any>;
}

const EventCheckinSchema = new Schema<IEventCheckin>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required'],
    index: true
  },

  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: [true, 'Event Booking ID is required']
  },

  checkinNumber: {
    type: String,
    required: [true, 'Check-in number is required'],
    unique: true,
    trim: true
  },

  // Event Information
  eventDetails: {
    eventName: {
      type: String,
      required: [true, 'Event name is required']
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required']
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'EventVenue',
      required: [true, 'Venue ID is required']
    },
    venueName: {
      type: String,
      required: [true, 'Venue name is required']
    },
    expectedGuests: {
      type: Number,
      required: [true, 'Expected guests count is required'],
      min: [1, 'Expected guests must be at least 1']
    }
  },

  // Check-in Configuration
  checkinConfig: {
    checkinStartTime: {
      type: Date,
      required: [true, 'Check-in start time is required']
    },
    checkinEndTime: {
      type: Date,
      required: [true, 'Check-in end time is required']
    },
    allowEarlyCheckin: {
      type: Boolean,
      default: true
    },
    earlyCheckinMinutes: {
      type: Number,
      default: 30,
      min: [0, 'Early check-in minutes cannot be negative']
    },
    requireIdVerification: {
      type: Boolean,
      default: false
    },
    allowGuestAdditions: {
      type: Boolean,
      default: true
    },
    maxGuestAdditions: {
      type: Number,
      default: 2,
      min: [0, 'Max guest additions cannot be negative']
    },
    qrCodeEnabled: {
      type: Boolean,
      default: true
    },
    manualCheckinEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Guest List & Check-ins
  guestList: [{
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required']
    },
    guestEmail: String,
    guestPhone: String,
    guestType: {
      type: String,
      required: [true, 'Guest type is required'],
      enum: {
        values: ['primary', 'plus-one', 'vip', 'staff', 'vendor', 'media'],
        message: 'Invalid guest type'
      }
    },
    tableNumber: String,
    seatNumber: String,
    mealPreference: String,
    specialRequirements: [String],
    dietaryRestrictions: [String],
    
    // Check-in Status
    checkinStatus: {
      type: String,
      enum: {
        values: ['pending', 'checked-in', 'no-show', 'cancelled'],
        message: 'Invalid check-in status'
      },
      default: 'pending'
    },
    checkinTime: Date,
    checkinMethod: {
      type: String,
      enum: ['qr-code', 'manual', 'self-service', 'mobile-app']
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    checkinLocation: String,
    
    // Additional guests
    additionalGuests: [{
      name: {
        type: String,
        required: true
      },
      relation: String,
      checkinTime: Date
    }],
    
    checkinNotes: String,
    issues: [String]
  }],

  // Real-time Stats
  checkinStats: {
    totalExpected: {
      type: Number,
      default: 0,
      min: [0, 'Total expected cannot be negative']
    },
    totalCheckedIn: {
      type: Number,
      default: 0,
      min: [0, 'Total checked in cannot be negative']
    },
    totalNoShows: {
      type: Number,
      default: 0,
      min: [0, 'Total no-shows cannot be negative']
    },
    checkinRate: {
      type: Number,
      default: 0,
      min: [0, 'Check-in rate cannot be negative'],
      max: [100, 'Check-in rate cannot exceed 100']
    },
    peakCheckinTime: Date,
    averageCheckinDuration: {
      type: Number,
      default: 0,
      min: [0, 'Average check-in duration cannot be negative']
    },
    vipCheckedIn: {
      type: Number,
      default: 0
    },
    regularCheckedIn: {
      type: Number,
      default: 0
    },
    staffCheckedIn: {
      type: Number,
      default: 0
    },
    earlyCheckins: {
      type: Number,
      default: 0
    },
    onTimeCheckins: {
      type: Number,
      default: 0
    },
    lateCheckins: {
      type: Number,
      default: 0
    }
  },

  // Check-in Sessions
  checkinSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    staffMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    deviceInfo: String,
    guestsProcessed: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0
    },
    issues: [{
      time: {
        type: Date,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      resolution: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  }],

  // QR Codes
  qrCodes: [{
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    qrCodeData: {
      type: String,
      required: true
    },
    qrCodeUrl: {
      type: String,
      required: true
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    sentAt: Date,
    scannedAt: Date,
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiryDate: Date
  }],

  // Integrations
  integrations: {
    smsNotifications: {
      enabled: {
        type: Boolean,
        default: false
      },
      remindersSent: {
        type: Number,
        default: 0
      },
      confirmationsSent: {
        type: Number,
        default: 0
      }
    },
    emailNotifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      invitationsSent: {
        type: Number,
        default: 0
      },
      remindersSent: {
        type: Number,
        default: 0
      }
    },
    mobileApp: {
      enabled: {
        type: Boolean,
        default: false
      },
      appDownloads: {
        type: Number,
        default: 0
      },
      appCheckins: {
        type: Number,
        default: 0
      }
    }
  },

  // Security
  security: {
    accessControlEnabled: {
      type: Boolean,
      default: false
    },
    securityCheckpoints: [{
      checkpointName: {
        type: String,
        required: true
      },
      location: {
        type: String,
        required: true
      },
      staffMemberId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      guestsProcessed: {
        type: Number,
        default: 0
      },
      flaggedGuests: {
        type: Number,
        default: 0
      },
      issues: [{
        time: Date,
        guestName: String,
        issue: String,
        resolution: String
      }]
    }],
    bannedGuests: [{
      guestName: {
        type: String,
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      bannedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      bannedDate: {
        type: Date,
        required: true,
        default: Date.now
      }
    }]
  },

  // Notifications
  notifications: [{
    type: {
      type: String,
      required: true,
      enum: ['guest-arrival', 'vip-arrival', 'issue-reported', 'capacity-warning', 'system-alert']
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    recipients: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    sent: {
      type: Boolean,
      default: false
    },
    acknowledged: [{
      staffMemberId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      acknowledgedAt: Date
    }]
  }],

  // Timeline Updates
  timelineUpdates: [{
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    event: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['checkin', 'security', 'capacity', 'vip', 'issue', 'milestone']
    },
    metadata: Schema.Types.Mixed
  }],

  // Analytics
  analytics: {
    checkinFlow: [{
      timeSlot: {
        type: String,
        required: true
      },
      guestsCheckedIn: {
        type: Number,
        required: true,
        min: 0
      },
      averageWaitTime: {
        type: Number,
        required: true,
        min: 0
      },
      peakLoad: {
        type: Boolean,
        default: false
      }
    }],
    issuesSummary: [{
      issueType: String,
      count: Number,
      averageResolutionTime: Number
    }],
    guestSatisfaction: {
      totalResponses: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 1,
        max: 5
      },
      feedbackComments: [String]
    }
  },

  // Status & Metadata
  status: {
    type: String,
    required: true,
    enum: {
      values: ['setup', 'active', 'paused', 'completed', 'cancelled'],
      message: 'Invalid check-in status'
    },
    default: 'setup'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'eventCheckins'
});

// Pre-save middleware
EventCheckinSchema.pre('save', function() {
  const doc = this as any;
  
  // Generate check-in number if not provided
  if (!doc.checkinNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    doc.checkinNumber = `CHK${dateStr}${timeStr}`;
  }

  // Update stats
  if (doc.guestList) {
    const checkedInGuests = doc.guestList.filter((g: any) => g.checkinStatus === 'checked-in');
    const noShowGuests = doc.guestList.filter((g: any) => g.checkinStatus === 'no-show');
    
    doc.checkinStats.totalExpected = doc.guestList.length;
    doc.checkinStats.totalCheckedIn = checkedInGuests.length;
    doc.checkinStats.totalNoShows = noShowGuests.length;
    doc.checkinStats.checkinRate = doc.checkinStats.totalExpected > 0 
      ? Math.round((doc.checkinStats.totalCheckedIn / doc.checkinStats.totalExpected) * 100)
      : 0;
    
    // Count by guest types
    doc.checkinStats.vipCheckedIn = checkedInGuests.filter((g: any) => g.guestType === 'vip').length;
    doc.checkinStats.regularCheckedIn = checkedInGuests.filter((g: any) => 
      ['primary', 'plus-one'].includes(g.guestType)
    ).length;
    doc.checkinStats.staffCheckedIn = checkedInGuests.filter((g: any) => g.guestType === 'staff').length;
  }
});

// Indexes
EventCheckinSchema.index({ propertyId: 1, checkinNumber: 1 }, { unique: true });
EventCheckinSchema.index({ eventBookingId: 1 });
EventCheckinSchema.index({ status: 1 });
EventCheckinSchema.index({ 'eventDetails.eventDate': 1 });
EventCheckinSchema.index({ 'guestList.checkinStatus': 1 });
EventCheckinSchema.index({ createdAt: -1 });

// Methods
EventCheckinSchema.methods.checkInGuest = function(guestId: string, checkinData: any) {
  const doc = this as any;
  const guest = doc.guestList.find((g: any) => g._id.toString() === guestId);
  
  if (guest) {
    guest.checkinStatus = 'checked-in';
    guest.checkinTime = new Date();
    guest.checkinMethod = checkinData.method || 'manual';
    guest.checkedInBy = checkinData.staffMemberId;
    guest.checkinLocation = checkinData.location;
    guest.checkinNotes = checkinData.notes;
    
    // Add additional guests if any
    if (checkinData.additionalGuests) {
      guest.additionalGuests = checkinData.additionalGuests;
    }

    // Add timeline update
    doc.timelineUpdates.push({
      timestamp: new Date(),
      event: 'Guest Check-in',
      description: `${guest.guestName} checked in${guest.guestType === 'vip' ? ' (VIP)' : ''}`,
      category: guest.guestType === 'vip' ? 'vip' : 'checkin',
      metadata: {
        guestId: guest._id,
        guestName: guest.guestName,
        guestType: guest.guestType,
        method: guest.checkinMethod
      }
    });

    // Send notification for VIP arrivals
    if (guest.guestType === 'vip') {
      doc.notifications.push({
        type: 'vip-arrival',
        message: `VIP guest ${guest.guestName} has arrived`,
        timestamp: new Date(),
        priority: 'high',
        sent: false
      });
    }
  }
  
  return doc.save();
};

EventCheckinSchema.methods.generateQRCodes = function() {
  const doc = this as any;
  
  doc.guestList?.forEach((guest: any) => {
    if (!doc.qrCodes.find((qr: any) => qr.guestId?.toString() === guest._id.toString())) {
      const qrData = `${doc.checkinNumber}-${guest._id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      
      doc.qrCodes.push({
        guestId: guest._id,
        qrCodeData: qrData,
        qrCodeUrl: qrUrl,
        generatedAt: new Date(),
        isActive: true
      });
    }
  });
  
  return doc.save();
};

EventCheckinSchema.methods.sendNotifications = function(type: string, message: string) {
  const doc = this as any;
  
  doc.notifications.push({
    type,
    message,
    timestamp: new Date(),
    priority: 'medium',
    sent: false
  });
  
  return doc.save();
};

EventCheckinSchema.methods.updateStats = function() {
  // This method is called by the pre-save middleware
  return this.save();
};

EventCheckinSchema.methods.exportGuestList = function() {
  const doc = this as any;
  
  return {
    eventName: doc.eventDetails.eventName,
    eventDate: doc.eventDetails.eventDate,
    venue: doc.eventDetails.venueName,
    guests: doc.guestList?.map((guest: any) => ({
      name: guest.guestName,
      email: guest.guestEmail,
      phone: guest.guestPhone,
      type: guest.guestType,
      checkinStatus: guest.checkinStatus,
      checkinTime: guest.checkinTime,
      tableNumber: guest.tableNumber,
      mealPreference: guest.mealPreference
    })) || [],
    stats: doc.checkinStats
  };
};

const EventCheckin = models.EventCheckin || model('EventCheckin', EventCheckinSchema);

export default EventCheckin;