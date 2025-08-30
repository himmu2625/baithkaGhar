import { Schema, model, models } from 'mongoose';

// Define the staff role permissions
const ROLE_PERMISSIONS = {
  manager: [
    'view_dashboard', 'manage_staff', 'manage_bookings', 'manage_inventory',
    'view_financial', 'manage_settings', 'manage_ota', 'view_analytics',
    'manage_guests', 'manage_maintenance', 'view_all_reports'
  ],
  frontdesk: [
    'view_dashboard', 'manage_bookings', 'view_inventory', 'manage_guests',
    'view_basic_reports', 'checkin_checkout'
  ],
  housekeeping: [
    'view_dashboard', 'manage_inventory', 'update_room_status',
    'view_maintenance', 'report_issues'
  ],
  maintenance: [
    'view_dashboard', 'manage_maintenance', 'update_room_status',
    'view_inventory', 'report_completion'
  ],
  accountant: [
    'view_dashboard', 'view_financial', 'manage_payments', 'view_analytics',
    'generate_reports', 'view_bookings'
  ],
  staff: [
    'view_dashboard', 'view_assigned_tasks', 'update_task_status'
  ]
};

// Staff member schema
const StaffMemberSchema = new Schema({
  // Basic Information
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  employeeId: {
    type: String,
    required: true
  },
  
  // Personal Details
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    profilePicture: String, // URL to profile image
    governmentId: {
      type: { type: String, enum: ['passport', 'aadhar', 'pan', 'drivinglicense'] },
      number: String,
      verified: { type: Boolean, default: false }
    }
  },

  // Employment Information
  employment: {
    role: {
      type: String,
      enum: ['manager', 'frontdesk', 'housekeeping', 'maintenance', 'accountant', 'staff'],
      required: true
    },
    department: {
      type: String,
      enum: ['management', 'frontdesk', 'housekeeping', 'maintenance', 'accounts', 'security', 'other'],
      required: true
    },
    designation: {
      type: String,
      required: true // e.g., "Front Desk Manager", "Housekeeper", "Maintenance Technician"
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time'
    },
    joiningDate: {
      type: Date,
      required: true
    },
    probationEndDate: Date,
    
    // Salary and Benefits
    salary: {
      basic: { type: Number, required: true },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      payFrequency: { type: String, enum: ['monthly', 'weekly', 'daily'], default: 'monthly' }
    },
    
    // Reporting Structure
    reportsTo: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    teamMembers: [{
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }]
  },

  // Access and Permissions
  access: {
    isActive: {
      type: Boolean,
      default: true
    },
    permissions: [{
      type: String,
      enum: Object.values(ROLE_PERMISSIONS).flat()
    }],
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    accountLocked: {
      type: Boolean,
      default: false
    },
    lockUntil: Date,
    
    // System Access
    osAccess: {
      type: Boolean,
      default: true // Can access the OS system
    },
    mobileAccess: {
      type: Boolean,
      default: false // Can use mobile app
    },
    apiAccess: {
      type: Boolean,
      default: false // Can use API endpoints
    }
  },

  // Work Schedule
  schedule: {
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    shiftType: {
      type: String,
      enum: ['day', 'night', 'rotating', 'flexible'],
      default: 'day'
    },
    workingHours: {
      start: { type: String }, // "09:00"
      end: { type: String },   // "18:00"
      breakTime: { type: Number, default: 60 } // minutes
    },
    hoursPerWeek: {
      type: Number,
      default: 40
    },
    overtimeEligible: {
      type: Boolean,
      default: true
    }
  },

  // Skills and Training
  skills: [{
    name: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    certified: { type: Boolean, default: false },
    certificationDate: Date,
    expiryDate: Date
  }],

  training: [{
    program: String,
    completedDate: Date,
    certificateUrl: String,
    validity: Date,
    score: Number
  }],

  // Performance and Attendance
  performance: {
    currentRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    lastReviewDate: Date,
    nextReviewDate: Date,
    goals: [{
      title: String,
      description: String,
      targetDate: Date,
      status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
    }],
    achievements: [{
      title: String,
      description: String,
      date: Date,
      recognizedBy: String
    }],
    warnings: [{
      type: { type: String, enum: ['verbal', 'written', 'final'] },
      reason: String,
      date: Date,
      issuedBy: String,
      resolved: { type: Boolean, default: false }
    }]
  },

  attendance: {
    totalLeaves: { type: Number, default: 0 },
    usedLeaves: { type: Number, default: 0 },
    sickLeaves: { type: Number, default: 0 },
    casualLeaves: { type: Number, default: 0 },
    earnedLeaves: { type: Number, default: 0 },
    lateMarks: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 }
  },

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'offer_letter', 'contract', 'id_proof', 'address_proof', 
             'experience_letter', 'medical_certificate', 'other'],
      required: true
    },
    name: String,
    url: String, // Cloud storage URL
    uploadDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    expiryDate: Date
  }],

  // Notifications and Communication
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    preferredLanguage: { type: String, default: 'en' }
  },

  // System Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_leave', 'suspended'],
    default: 'active'
  },
  terminationDate: Date,
  terminationReason: String,
  
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
StaffMemberSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Auto-assign permissions based on role
  if (this.isModified('employment.role') && this.access && this.employment?.role) {
    this.access.permissions = ROLE_PERMISSIONS[this.employment.role as keyof typeof ROLE_PERMISSIONS] || [];
  }
  
  // Generate employee ID if not provided
  if (!this.employeeId && this.employment?.role) {
    const rolePrefix = this.employment.role.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.employeeId = `${rolePrefix}${timestamp}`;
  }
});

// Indexes
StaffMemberSchema.index({ propertyId: 1, 'employment.role': 1 });
StaffMemberSchema.index({ propertyId: 1, status: 1 });
StaffMemberSchema.index({ employeeId: 1 }, { unique: true });
StaffMemberSchema.index({ 'personalInfo.email': 1 }, { unique: true });
StaffMemberSchema.index({ 'employment.department': 1 });
StaffMemberSchema.index({ 'access.isActive': 1 });
StaffMemberSchema.index({ createdAt: -1 });

// Virtual for full name
StaffMemberSchema.virtual('fullName').get(function() {
  return `${this.personalInfo?.firstName || ''} ${this.personalInfo?.lastName || ''}`.trim();
});

// Instance methods
StaffMemberSchema.methods.hasPermission = function(permission: string): boolean {
  return this.access?.permissions?.includes(permission) || false;
};

StaffMemberSchema.methods.canAccessModule = function(module: string): boolean {
  const modulePermissions: { [key: string]: string[] } = {
    'dashboard': ['view_dashboard'],
    'bookings': ['manage_bookings', 'view_bookings'],
    'inventory': ['manage_inventory', 'view_inventory'],
    'financial': ['view_financial', 'manage_payments'],
    'staff': ['manage_staff'],
    'settings': ['manage_settings'],
    'ota': ['manage_ota'],
    'analytics': ['view_analytics'],
    'guests': ['manage_guests'],
    'maintenance': ['manage_maintenance']
  };
  
  const requiredPermissions = modulePermissions[module] || [];
  return requiredPermissions.some(permission => this.hasPermission(permission));
};

StaffMemberSchema.methods.isManager = function(): boolean {
  return this.employment?.role === 'manager';
};

StaffMemberSchema.methods.canManageStaff = function(): boolean {
  return this.hasPermission('manage_staff');
};

// Static methods
StaffMemberSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId, status: 'active' });
};

StaffMemberSchema.statics.findByRole = function(propertyId: string, role: string) {
  return this.find({ propertyId, 'employment.role': role, status: 'active' });
};

StaffMemberSchema.statics.findByDepartment = function(propertyId: string, department: string) {
  return this.find({ propertyId, 'employment.department': department, status: 'active' });
};

// Ensure virtuals are included in JSON
StaffMemberSchema.set('toJSON', { virtuals: true });
StaffMemberSchema.set('toObject', { virtuals: true });

const StaffMember = models.StaffMember || model('StaffMember', StaffMemberSchema);

export default StaffMember;
export { ROLE_PERMISSIONS };