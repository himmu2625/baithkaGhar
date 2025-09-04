import { Schema, model, models } from 'mongoose';

const EventStaffSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  staffMemberId: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMember',
    required: true
  },
  
  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: true
  },
  
  assignment: {
    role: {
      type: String,
      enum: ['event_coordinator', 'manager', 'assistant_manager', 'head_chef', 'chef', 'sous_chef', 'server', 'bartender', 'decorator', 'florist', 'av_technician', 'photographer', 'videographer', 'security', 'valet', 'cleaner', 'setup_crew', 'coordinator_assistant'],
      required: true
    },
    
    department: {
      type: String,
      enum: ['management', 'culinary', 'service', 'decoration', 'technical', 'security', 'support'],
      required: true
    },
    
    responsibility: {
      type: String,
      enum: ['lead', 'senior', 'junior', 'trainee', 'support'],
      default: 'junior'
    },
    
    isLead: { type: Boolean, default: false },
    reportsTo: {
      type: Schema.Types.ObjectId,
      ref: 'EventStaff'
    }
  },
  
  schedule: {
    assignedDate: {
      type: Date,
      required: true
    },
    
    workingHours: {
      startTime: {
        type: String,
        required: true // "08:00"
      },
      endTime: {
        type: String,
        required: true // "22:00"
      },
      totalHours: { type: Number }, // calculated automatically
      
      breaks: [{
        startTime: String,
        endTime: String,
        duration: Number, // minutes
        type: {
          type: String,
          enum: ['meal_break', 'rest_break', 'setup_break'],
          default: 'rest_break'
        }
      }]
    },
    
    phases: [{
      phase: {
        type: String,
        enum: ['pre_event_setup', 'event_execution', 'post_event_cleanup', 'full_event'],
        required: true
      },
      startTime: String,
      endTime: String,
      tasks: [String],
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      }
    }]
  },
  
  skills: {
    requiredSkills: [{
      skill: String,
      proficiencyLevel: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'expert'],
        required: true
      },
      isCritical: { type: Boolean, default: false }
    }],
    
    certifications: [{
      certificationName: String,
      issuedBy: String,
      issueDate: Date,
      expiryDate: Date,
      isRequired: { type: Boolean, default: false }
    }],
    
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native'],
        default: 'basic'
      },
      isRequired: { type: Boolean, default: false }
    }]
  },
  
  compensation: {
    paymentType: {
      type: String,
      enum: ['hourly', 'daily', 'event_based', 'fixed'],
      default: 'hourly'
    },
    
    baseRate: {
      type: Number,
      required: true,
      min: 0
    },
    
    overtime: {
      eligible: { type: Boolean, default: true },
      rate: { type: Number, default: 0 }, // per hour
      threshold: { type: Number, default: 8 } // hours after which overtime applies
    },
    
    bonuses: [{
      type: {
        type: String,
        enum: ['performance', 'completion', 'client_satisfaction', 'additional_responsibility']
      },
      amount: Number,
      criteria: String,
      earned: { type: Boolean, default: false }
    }],
    
    deductions: [{
      type: {
        type: String,
        enum: ['late_arrival', 'early_departure', 'uniform', 'damage', 'other']
      },
      amount: Number,
      reason: String
    }],
    
    totalCompensation: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  
  tasks: [{
    taskId: String,
    taskName: {
      type: String,
      required: true
    },
    description: String,
    
    timing: {
      scheduledStart: Date,
      scheduledEnd: Date,
      actualStart: Date,
      actualEnd: Date
    },
    
    location: {
      venue: String,
      specificArea: String,
      coordinates: String
    },
    
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
      default: 'assigned'
    },
    
    completion: {
      completedAt: Date,
      completedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      qualityRating: {
        type: Number,
        min: 1,
        max: 5
      },
      notes: String,
      issues: String
    },
    
    dependencies: [{
      dependentTaskId: String,
      relationship: {
        type: String,
        enum: ['prerequisite', 'concurrent', 'sequential']
      }
    }],
    
    resources: [{
      resourceType: String,
      resourceName: String,
      quantity: Number,
      isAvailable: { type: Boolean, default: true }
    }]
  }],
  
  performance: {
    punctuality: {
      arrivedOnTime: { type: Boolean, default: true },
      arrivalTime: Date,
      lateBy: { type: Number, default: 0 }, // minutes
      earlyDeparture: { type: Boolean, default: false },
      departureTime: Date
    },
    
    taskCompletion: {
      tasksAssigned: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      tasksOnTime: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }, // percentage
      averageQuality: { type: Number, default: 0 }
    },
    
    clientInteraction: {
      clientFeedback: [{
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        aspect: String // 'service', 'professionalism', 'knowledge'
      }],
      averageRating: { type: Number, default: 0 },
      compliments: { type: Number, default: 0 },
      complaints: { type: Number, default: 0 }
    },
    
    teamwork: {
      collaborationRating: { type: Number, min: 1, max: 5, default: 3 },
      leadershipShown: { type: Boolean, default: false },
      helpedOthers: { type: Boolean, default: false },
      communicationEffective: { type: Boolean, default: true }
    },
    
    overallRating: { type: Number, min: 1, max: 5, default: 3 }
  },
  
  attendance: {
    clockIn: {
      scheduled: Date,
      actual: Date,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'mobile_app', 'supervisor'],
        default: 'manual'
      },
      location: String
    },
    
    clockOut: {
      scheduled: Date,
      actual: Date,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'mobile_app', 'supervisor'],
        default: 'manual'
      },
      location: String
    },
    
    breaks: [{
      breakType: String,
      startTime: Date,
      endTime: Date,
      duration: Number, // minutes
      authorized: { type: Boolean, default: true }
    }],
    
    workingHours: {
      scheduled: Number,
      actual: Number,
      overtime: { type: Number, default: 0 },
      undertime: { type: Number, default: 0 }
    }
  },
  
  communication: [{
    timestamp: Date,
    from: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    to: [{
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    }],
    message: String,
    type: {
      type: String,
      enum: ['instruction', 'update', 'request', 'feedback', 'emergency']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    acknowledged: { type: Boolean, default: false },
    response: String
  }],
  
  equipment: [{
    equipmentName: String,
    equipmentId: String,
    assignedAt: Date,
    returnedAt: Date,
    condition: {
      atAssignment: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good'
      },
      atReturn: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'lost']
      }
    },
    responsible: { type: Boolean, default: true },
    damages: [{
      description: String,
      cost: Number,
      responsible: { type: Boolean, default: false }
    }]
  }],
  
  uniform: {
    issued: { type: Boolean, default: false },
    items: [{
      itemName: String,
      size: String,
      quantity: Number,
      condition: String,
      issuedDate: Date,
      returnRequired: { type: Boolean, default: true }
    }],
    dress_code: String,
    grooming_standards: String,
    compliance: { type: Boolean, default: true }
  },
  
  training: {
    preEventBriefing: {
      attended: { type: Boolean, default: false },
      briefingDate: Date,
      briefedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      topicsCovered: [String],
      questionsAsked: [String],
      understanding: {
        type: String,
        enum: ['excellent', 'good', 'satisfactory', 'needs_improvement'],
        default: 'satisfactory'
      }
    },
    
    skillsTraining: [{
      skill: String,
      trainingDate: Date,
      trainer: String,
      duration: Number, // hours
      completed: { type: Boolean, default: false },
      assessment: {
        score: Number,
        passed: { type: Boolean, default: false },
        feedback: String
      }
    }],
    
    onJobTraining: {
      mentor: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      startDate: Date,
      endDate: Date,
      progress: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
      },
      feedback: String
    }
  },
  
  issues: [{
    issueDate: Date,
    category: {
      type: String,
      enum: ['performance', 'behavior', 'attendance', 'safety', 'client_complaint', 'equipment', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'serious', 'critical'],
      default: 'moderate'
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    actionTaken: String,
    resolution: String,
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    resolved: { type: Boolean, default: false },
    resolvedDate: Date
  }],
  
  feedback: {
    fromSupervisor: {
      rating: { type: Number, min: 1, max: 5 },
      strengths: [String],
      areasForImprovement: [String],
      overallComment: String,
      recommendations: [String]
    },
    
    fromClient: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      wouldRequestAgain: { type: Boolean, default: false },
      specificPraise: [String],
      complaints: [String]
    },
    
    fromPeers: [{
      peerId: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      aspect: String
    }],
    
    selfEvaluation: {
      rating: { type: Number, min: 1, max: 5 },
      challenges: [String],
      achievements: [String],
      learnings: [String],
      suggestions: [String]
    }
  },
  
  status: {
    type: String,
    enum: ['assigned', 'confirmed', 'checked_in', 'working', 'on_break', 'checked_out', 'completed', 'no_show', 'cancelled'],
    default: 'assigned'
  },
  
  notes: {
    assignmentNotes: String,
    supervisorNotes: String,
    performanceNotes: String,
    clientSpecificInstructions: String
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
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

EventStaffSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate total working hours
  if (this.schedule?.workingHours?.startTime && this.schedule?.workingHours?.endTime) {
    const [startHour, startMin] = this.schedule.workingHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.schedule.workingHours.endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    
    // Subtract break time
    const breakTime = this.schedule.workingHours.breaks?.reduce((total: number, breakItem: any) => {
      return total + (breakItem.duration || 0);
    }, 0) || 0;
    
    this.schedule.workingHours.totalHours = (totalMinutes - breakTime) / 60;
  }
  
  // Calculate task completion rate
  if (this.tasks?.length > 0) {
    const completedTasks = this.tasks.filter((task: any) => task.status === 'completed').length;
    
    // Initialize performance if it doesn't exist
    if (!this.performance) {
      this.performance = {} as any;
    }
    
    // Initialize taskCompletion if it doesn't exist
    if (!this.performance!.taskCompletion) {
      this.performance!.taskCompletion = {} as any;
    }
    
    // Set task completion values
    this.performance!.taskCompletion!.tasksAssigned = this.tasks.length;
    this.performance!.taskCompletion!.tasksCompleted = completedTasks;
    this.performance!.taskCompletion!.completionRate = (completedTasks / this.tasks.length) * 100;
    
    // Initialize overall rating if not set
    if (!this.performance!.overallRating) {
      this.performance!.overallRating = 3;
    }
  }
  
  // Calculate total compensation
  if (this.compensation && this.schedule?.workingHours?.totalHours) {
    let total = 0;
    const regularHours = Math.min(this.schedule.workingHours.totalHours, this.compensation.overtime?.threshold || 8);
    const overtimeHours = Math.max(0, this.schedule.workingHours.totalHours - (this.compensation.overtime?.threshold || 8));
    
    if (this.compensation.paymentType === 'hourly') {
      total = regularHours * this.compensation.baseRate;
      if (this.compensation.overtime?.eligible && overtimeHours > 0) {
        total += overtimeHours * (this.compensation.overtime.rate || this.compensation.baseRate * 1.5);
      }
    } else {
      total = this.compensation.baseRate;
    }
    
    // Add bonuses
    const bonusAmount = this.compensation.bonuses?.reduce((sum: number, bonus: any) => {
      return sum + (bonus.earned ? bonus.amount : 0);
    }, 0) || 0;
    
    // Subtract deductions
    const deductionAmount = this.compensation.deductions?.reduce((sum: number, deduction: any) => {
      return sum + (deduction.amount || 0);
    }, 0) || 0;
    
    this.compensation.totalCompensation = total + bonusAmount - deductionAmount;
  }
});

EventStaffSchema.index({ propertyId: 1, staffMemberId: 1, eventBookingId: 1 });
EventStaffSchema.index({ eventBookingId: 1, 'assignment.role': 1 });
EventStaffSchema.index({ staffMemberId: 1, 'schedule.assignedDate': 1 });
EventStaffSchema.index({ propertyId: 1, status: 1 });
EventStaffSchema.index({ 'schedule.assignedDate': 1 });

EventStaffSchema.methods.updateStatus = function(newStatus: string, updatedBy?: string) {
  this.status = newStatus;
  if (updatedBy) {
    this.lastUpdatedBy = updatedBy;
  }
  
  // Update attendance based on status
  if (newStatus === 'checked_in' && !this.attendance?.clockIn?.actual) {
    this.attendance = this.attendance || {};
    this.attendance.clockIn = this.attendance.clockIn || {};
    this.attendance.clockIn.actual = new Date();
  } else if (newStatus === 'checked_out' && !this.attendance?.clockOut?.actual) {
    this.attendance = this.attendance || {};
    this.attendance.clockOut = this.attendance.clockOut || {};
    this.attendance.clockOut.actual = new Date();
  }
  
  return this.save();
};

EventStaffSchema.methods.assignTask = function(taskData: any) {
  this.tasks = this.tasks || [];
  
  const newTask = {
    ...taskData,
    taskId: Date.now().toString(),
    status: 'assigned'
  };
  
  this.tasks.push(newTask);
  return this.save();
};

EventStaffSchema.methods.updateTask = function(taskId: string, updates: any) {
  const task = this.tasks?.find((t: any) => t.taskId === taskId);
  if (task) {
    Object.assign(task, updates);
    
    if (updates.status === 'completed') {
      task.completion = task.completion || {};
      task.completion.completedAt = new Date();
    }
  }
  
  return this.save();
};

EventStaffSchema.methods.recordAttendance = function(type: 'clockIn' | 'clockOut', method = 'manual', location?: string) {
  this.attendance = this.attendance || {};
  this.attendance[type] = this.attendance[type] || {};
  
  this.attendance[type].actual = new Date();
  this.attendance[type].method = method;
  if (location) {
    this.attendance[type].location = location;
  }
  
  return this.save();
};

EventStaffSchema.methods.addCommunication = function(communicationData: any) {
  this.communication = this.communication || [];
  
  this.communication.push({
    ...communicationData,
    timestamp: new Date()
  });
  
  return this.save();
};

EventStaffSchema.methods.reportIssue = function(issueData: any, reportedBy: string) {
  this.issues = this.issues || [];
  
  this.issues.push({
    ...issueData,
    issueDate: new Date(),
    reportedBy,
    resolved: false
  });
  
  return this.save();
};

EventStaffSchema.methods.addFeedback = function(feedbackData: any, feedbackType: string) {
  this.feedback = this.feedback || {};
  
  if (feedbackType === 'supervisor') {
    this.feedback.fromSupervisor = feedbackData;
  } else if (feedbackType === 'client') {
    this.feedback.fromClient = feedbackData;
  } else if (feedbackType === 'peer') {
    this.feedback.fromPeers = this.feedback.fromPeers || [];
    this.feedback.fromPeers.push(feedbackData);
  } else if (feedbackType === 'self') {
    this.feedback.selfEvaluation = feedbackData;
  }
  
  return this.save();
};

EventStaffSchema.statics.findByEvent = function(eventBookingId: string) {
  return this.find({ eventBookingId }).populate('staffMemberId').sort({ 'assignment.role': 1 });
};

EventStaffSchema.statics.findByStaffMember = function(staffMemberId: string, startDate?: Date, endDate?: Date) {
  let query: any = { staffMemberId };
  
  if (startDate && endDate) {
    query['schedule.assignedDate'] = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).populate('eventBookingId').sort({ 'schedule.assignedDate': -1 });
};

EventStaffSchema.statics.findAvailableStaff = function(propertyId: string, date: Date, role?: string) {
  let query: any = {
    propertyId,
    'schedule.assignedDate': date,
    status: { $in: ['assigned', 'confirmed'] }
  };
  
  if (role) {
    query['assignment.role'] = role;
  }
  
  return this.find(query).populate('staffMemberId');
};

EventStaffSchema.statics.getStaffSchedule = function(propertyId: string, date: Date) {
  return this.find({
    propertyId,
    'schedule.assignedDate': date
  }).populate(['staffMemberId', 'eventBookingId']).sort({ 'schedule.workingHours.startTime': 1 });
};

EventStaffSchema.statics.getPerformanceReport = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        'schedule.assignedDate': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$staffMemberId',
        totalAssignments: { $sum: 1 },
        averageRating: { $avg: '$performance.overallRating' },
        totalHours: { $sum: '$schedule.workingHours.totalHours' },
        completionRate: { $avg: '$performance.taskCompletion.completionRate' },
        punctualityRate: {
          $avg: { $cond: ['$performance.punctuality.arrivedOnTime', 1, 0] }
        }
      }
    },
    { $sort: { averageRating: -1 } }
  ]);
};

const EventStaff = models.EventStaff || model('EventStaff', EventStaffSchema);

export default EventStaff;