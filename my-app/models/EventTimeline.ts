import { Schema, model, models } from 'mongoose';

const EventTimelineSchema = new Schema({
  propertyId: {
    type: String,
    required: true,
    ref: 'Property'
  },
  
  eventBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: true
  },
  
  timelineName: {
    type: String,
    required: true,
    trim: true
  },
  
  eventDate: {
    type: Date,
    required: true
  },
  
  eventStartTime: {
    type: String,
    required: true // "14:00"
  },
  
  eventEndTime: {
    type: String,
    required: true // "22:00"
  },
  
  phases: [{
    phaseId: {
      type: String,
      required: true
    },
    phaseName: {
      type: String,
      required: true
    },
    phaseType: {
      type: String,
      enum: ['pre_event', 'event_execution', 'post_event', 'setup', 'breakdown', 'service', 'entertainment'],
      required: true
    },
    
    timing: {
      scheduledStart: {
        type: Date,
        required: true
      },
      scheduledEnd: {
        type: Date,
        required: true
      },
      actualStart: Date,
      actualEnd: Date,
      duration: Number, // minutes, calculated
      isFlexible: { type: Boolean, default: false },
      bufferTime: { type: Number, default: 0 } // extra minutes allowed
    },
    
    location: {
      venueId: {
        type: Schema.Types.ObjectId,
        ref: 'EventVenue'
      },
      specificArea: String,
      setupLocation: String
    },
    
    status: {
      type: String,
      enum: ['planned', 'ready', 'in_progress', 'completed', 'delayed', 'cancelled', 'modified'],
      default: 'planned'
    },
    
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    tasks: [{
      taskId: String,
      taskName: {
        type: String,
        required: true
      },
      description: String,
      
      assignedTo: [{
        staffType: {
          type: String,
          enum: ['coordinator', 'manager', 'chef', 'server', 'decorator', 'technician', 'vendor']
        },
        staffId: {
          type: Schema.Types.ObjectId,
          ref: 'StaffMember'
        },
        staffName: String,
        role: String,
        isPrimary: { type: Boolean, default: false }
      }],
      
      timing: {
        estimatedDuration: Number, // minutes
        startTime: Date,
        endTime: Date,
        deadline: Date,
        actualStart: Date,
        actualEnd: Date
      },
      
      resources: [{
        resourceType: {
          type: String,
          enum: ['equipment', 'material', 'inventory', 'service', 'venue_space']
        },
        resourceId: String,
        resourceName: String,
        quantity: Number,
        reservedFrom: Date,
        reservedUntil: Date,
        cost: Number
      }],
      
      dependencies: [{
        dependentTaskId: String,
        dependencyType: {
          type: String,
          enum: ['prerequisite', 'concurrent', 'blocks', 'triggers']
        },
        notes: String
      }],
      
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'],
        default: 'not_started'
      },
      
      completion: {
        completedAt: Date,
        completedBy: String,
        qualityRating: { type: Number, min: 1, max: 5 },
        notes: String,
        photos: [String],
        issues: String
      },
      
      instructions: String,
      specialRequirements: String,
      checkpoints: [{
        checkpoint: String,
        time: Date,
        status: String,
        notes: String
      }]
    }],
    
    milestones: [{
      milestoneName: String,
      targetTime: Date,
      actualTime: Date,
      achieved: { type: Boolean, default: false },
      criticalPath: { type: Boolean, default: false },
      notes: String
    }],
    
    contingency: {
      riskFactors: [String],
      backupPlan: String,
      alternativeTimings: [{
        scenario: String,
        adjustedStart: Date,
        adjustedEnd: Date,
        impact: String
      }],
      escalationProcedure: String
    }
  }],
  
  criticalPath: [{
    taskId: String,
    taskName: String,
    startTime: Date,
    endTime: Date,
    phaseId: String,
    bufferTime: Number,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  coordination: {
    coordinator: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true
    },
    
    communicationPlan: [{
      stakeholder: String,
      contactMethod: String,
      frequency: String,
      keyInformation: [String],
      escalationLevel: Number
    }],
    
    checkInSchedule: [{
      checkInTime: Date,
      type: {
        type: String,
        enum: ['status_update', 'quality_check', 'client_update', 'vendor_coordination']
      },
      participants: [String],
      location: String,
      agenda: [String]
    }],
    
    emergencyContacts: [{
      role: String,
      name: String,
      phone: String,
      availability: String,
      backup: String
    }]
  },
  
  logistics: {
    transportation: [{
      vehicleType: String,
      departure: {
        location: String,
        time: Date
      },
      arrival: {
        location: String,
        time: Date
      },
      passengers: [String],
      driver: String,
      contactNumber: String
    }],
    
    deliveries: [{
      vendor: String,
      items: [String],
      scheduledDelivery: Date,
      actualDelivery: Date,
      deliveryLocation: String,
      contactPerson: String,
      specialInstructions: String,
      received: { type: Boolean, default: false },
      receivedBy: String,
      condition: String
    }],
    
    setup: {
      earliestStartTime: Date,
      latestEndTime: Date,
      setupCrew: [{
        crewType: String,
        arrivalTime: Date,
        estimatedDuration: Number,
        supervisor: String,
        contact: String
      }],
      equipmentSchedule: [{
        equipment: String,
        deliveryTime: Date,
        setupTime: Date,
        testingTime: Date,
        removalTime: Date
      }]
    }
  },
  
  clientInteraction: {
    clientArrivals: [{
      guestType: {
        type: String,
        enum: ['vip', 'host', 'family', 'guest', 'vendor']
      },
      arrivalTime: Date,
      guestCount: Number,
      specialRequirements: String,
      meetingPoint: String,
      escort: String
    }],
    
    clientMilestones: [{
      milestone: String,
      time: Date,
      location: String,
      participants: [String],
      significance: String,
      photoOpportunity: { type: Boolean, default: false },
      mediaRequired: String
    }],
    
    presentations: [{
      presentationType: String,
      time: Date,
      duration: Number,
      presenter: String,
      audience: String,
      location: String,
      equipment: [String],
      rehearsal: Date
    }]
  },
  
  qualityCheckpoints: [{
    checkpointName: String,
    checkpointTime: Date,
    inspector: String,
    criteria: [{
      aspect: String,
      standard: String,
      weight: Number, // importance weight
      passed: { type: Boolean, default: false },
      notes: String,
      correctiveAction: String
    }],
    overallStatus: {
      type: String,
      enum: ['passed', 'failed', 'conditional'],
      default: 'passed'
    },
    signOffBy: String,
    signOffTime: Date
  }],
  
  riskManagement: {
    identifiedRisks: [{
      riskId: String,
      riskDescription: String,
      category: {
        type: String,
        enum: ['weather', 'vendor', 'technical', 'safety', 'timing', 'resource', 'client']
      },
      likelihood: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      impact: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      mitigationPlan: String,
      contingencyAction: String,
      responsiblePerson: String,
      monitoringFrequency: String,
      status: {
        type: String,
        enum: ['identified', 'monitoring', 'mitigated', 'occurred', 'resolved'],
        default: 'identified'
      }
    }],
    
    weatherContingency: {
      weatherMonitoring: { type: Boolean, default: false },
      indoorBackup: String,
      tentRental: String,
      heatingCooling: String,
      clientNotification: String
    }
  },
  
  performance: {
    adherenceToSchedule: {
      onTimeStart: { type: Boolean, default: false },
      onTimeEnd: { type: Boolean, default: false },
      delayReasons: [String],
      totalDelay: Number, // minutes
      recoveryActions: [String]
    },
    
    taskCompletion: {
      totalTasks: Number,
      completedTasks: Number,
      onTimeTasks: Number,
      delayedTasks: Number,
      cancelledTasks: Number,
      completionRate: Number, // percentage
      averageDelay: Number // minutes
    },
    
    qualityMetrics: {
      qualityChecksPassed: Number,
      qualityChecksFailed: Number,
      clientSatisfaction: { type: Number, min: 1, max: 5 },
      issuesReported: Number,
      issuesResolved: Number
    },
    
    resourceUtilization: {
      staffUtilization: Number, // percentage
      equipmentUtilization: Number,
      venueUtilization: Number,
      budgetUtilization: Number
    }
  },
  
  modifications: [{
    modificationId: String,
    modificationDate: Date,
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    modificationType: {
      type: String,
      enum: ['time_change', 'task_addition', 'task_removal', 'resource_change', 'scope_change']
    },
    description: String,
    reason: String,
    impact: {
      timeImpact: String,
      costImpact: Number,
      resourceImpact: String,
      qualityImpact: String
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    approvalDate: Date,
    clientNotified: { type: Boolean, default: false },
    clientApproved: { type: Boolean, default: false },
    implementationStatus: {
      type: String,
      enum: ['pending', 'implemented', 'cancelled'],
      default: 'pending'
    }
  }],
  
  communication: [{
    timestamp: Date,
    communicationType: {
      type: String,
      enum: ['status_update', 'issue_alert', 'milestone_achieved', 'delay_notification', 'quality_concern']
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    recipients: [{
      recipientType: String,
      recipientId: String,
      recipientName: String
    }],
    message: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    channel: {
      type: String,
      enum: ['in_person', 'phone', 'radio', 'app', 'email', 'whatsapp']
    },
    acknowledged: { type: Boolean, default: false },
    response: String,
    followUpRequired: { type: Boolean, default: false }
  }],
  
  documentation: {
    photos: [{
      url: String,
      caption: String,
      timestamp: Date,
      phase: String,
      takenBy: String,
      category: String
    }],
    
    videos: [{
      url: String,
      title: String,
      duration: Number,
      timestamp: Date,
      phase: String,
      recordedBy: String
    }],
    
    reports: [{
      reportType: {
        type: String,
        enum: ['progress', 'quality', 'incident', 'completion', 'post_event']
      },
      reportDate: Date,
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'StaffMember'
      },
      content: String,
      attachments: [String],
      sharedWith: [String]
    }]
  },
  
  status: {
    type: String,
    enum: ['draft', 'approved', 'in_progress', 'completed', 'cancelled', 'needs_revision'],
    default: 'draft'
  },
  
  version: {
    versionNumber: {
      type: Number,
      default: 1.0
    },
    lastRevised: Date,
    revisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    changeLog: [{
      version: Number,
      date: Date,
      changes: String,
      reason: String
    }]
  },
  
  approvals: [{
    approverRole: String,
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'StaffMember'
    },
    approvalDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'conditional'],
      default: 'pending'
    },
    comments: String,
    conditions: String
  }],
  
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
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

EventTimelineSchema.pre('save', function() {
  this.updatedAt = new Date();
  
  // Calculate phase durations
  if (this.phases) {
    this.phases.forEach((phase: any) => {
      if (phase.timing?.scheduledStart && phase.timing?.scheduledEnd) {
        const start = new Date(phase.timing.scheduledStart);
        const end = new Date(phase.timing.scheduledEnd);
        phase.timing.duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes
      }
    });
  }
  
  // Update performance metrics
  if (this.phases?.length > 0) {
    const totalTasks = this.phases.reduce((sum: number, phase: any) => sum + (phase.tasks?.length || 0), 0);
    const completedTasks = this.phases.reduce((sum: number, phase: any) => {
      return sum + (phase.tasks?.filter((task: any) => task.status === 'completed').length || 0);
    }, 0);
    
    this.performance = this.performance || { taskCompletion: {} };
    this.performance!.taskCompletion = this.performance!.taskCompletion || {};
    this.performance!.taskCompletion!.totalTasks = totalTasks;
    this.performance!.taskCompletion!.completedTasks = completedTasks;
    this.performance!.taskCompletion!.completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }
});

EventTimelineSchema.index({ propertyId: 1, eventBookingId: 1 });
EventTimelineSchema.index({ eventDate: 1 });
EventTimelineSchema.index({ status: 1 });
EventTimelineSchema.index({ 'coordination.coordinator': 1 });

EventTimelineSchema.methods.updatePhaseStatus = function(phaseId: string, newStatus: string, updatedBy?: string) {
  const phase = this.phases?.find((p: any) => p.phaseId === phaseId);
  if (phase) {
    phase.status = newStatus;
    
    if (newStatus === 'in_progress' && !phase.timing?.actualStart) {
      phase.timing.actualStart = new Date();
    } else if (newStatus === 'completed' && !phase.timing?.actualEnd) {
      phase.timing.actualEnd = new Date();
    }
  }
  
  if (updatedBy) {
    this.lastUpdatedBy = updatedBy;
  }
  
  return this.save();
};

EventTimelineSchema.methods.updateTaskStatus = function(phaseId: string, taskId: string, newStatus: string) {
  const phase = this.phases?.find((p: any) => p.phaseId === phaseId);
  if (phase) {
    const task = phase.tasks?.find((t: any) => t.taskId === taskId);
    if (task) {
      task.status = newStatus;
      
      if (newStatus === 'in_progress' && !task.timing?.actualStart) {
        task.timing.actualStart = new Date();
      } else if (newStatus === 'completed') {
        task.timing.actualEnd = new Date();
        task.completion = task.completion || {};
        task.completion.completedAt = new Date();
      }
    }
  }
  
  return this.save();
};

EventTimelineSchema.methods.addCommunication = function(communicationData: any) {
  this.communication = this.communication || [];
  
  this.communication.push({
    ...communicationData,
    timestamp: new Date()
  });
  
  return this.save();
};

EventTimelineSchema.methods.addModification = function(modificationData: any, modifiedBy: string) {
  this.modifications = this.modifications || [];
  
  this.modifications.push({
    ...modificationData,
    modificationId: Date.now().toString(),
    modificationDate: new Date(),
    modifiedBy,
    implementationStatus: 'pending'
  });
  
  // Increment version
  this.version = this.version || {};
  this.version.versionNumber = (this.version.versionNumber || 1.0) + 0.1;
  this.version.lastRevised = new Date();
  this.version.revisedBy = modifiedBy;
  
  return this.save();
};

EventTimelineSchema.methods.addRisk = function(riskData: any) {
  this.riskManagement = this.riskManagement || { identifiedRisks: [] };
  
  this.riskManagement.identifiedRisks.push({
    ...riskData,
    riskId: Date.now().toString(),
    status: 'identified'
  });
  
  return this.save();
};

EventTimelineSchema.methods.getActiveTasks = function(currentTime = new Date()) {
  const activeTasks: any[] = [];
  
  this.phases?.forEach((phase: any) => {
    if (phase.status === 'in_progress' || phase.status === 'ready') {
      phase.tasks?.forEach((task: any) => {
        if (task.status === 'in_progress' || 
            (task.timing?.startTime && new Date(task.timing.startTime) <= currentTime &&
             new Date(task.timing.endTime) >= currentTime)) {
          activeTasks.push({
            phaseId: phase.phaseId,
            phaseName: phase.phaseName,
            ...task
          });
        }
      });
    }
  });
  
  return activeTasks.sort((a, b) => new Date(a.timing?.startTime).getTime() - new Date(b.timing?.startTime).getTime());
};

EventTimelineSchema.methods.getCriticalPathTasks = function() {
  return this.criticalPath?.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
};

EventTimelineSchema.methods.getUpcomingMilestones = function(hoursAhead = 2) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
  const upcomingMilestones: any[] = [];
  
  this.phases?.forEach((phase: any) => {
    phase.milestones?.forEach((milestone: any) => {
      const milestoneTime = new Date(milestone.targetTime);
      if (milestoneTime >= now && milestoneTime <= futureTime && !milestone.achieved) {
        upcomingMilestones.push({
          phaseId: phase.phaseId,
          phaseName: phase.phaseName,
          ...milestone
        });
      }
    });
  });
  
  return upcomingMilestones.sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime());
};

EventTimelineSchema.statics.findByEvent = function(eventBookingId: string) {
  return this.findOne({ eventBookingId }).populate(['coordination.coordinator', 'createdBy']);
};

EventTimelineSchema.statics.findActiveTimelines = function(propertyId: string) {
  return this.find({
    propertyId,
    status: 'in_progress',
    isActive: true
  }).populate('eventBookingId').sort({ eventDate: 1 });
};

EventTimelineSchema.statics.findByDate = function(propertyId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    propertyId,
    eventDate: { $gte: startOfDay, $lte: endOfDay },
    isActive: true
  }).populate('eventBookingId').sort({ eventStartTime: 1 });
};

EventTimelineSchema.statics.findByCoordinator = function(coordinatorId: string) {
  return this.find({
    'coordination.coordinator': coordinatorId,
    isActive: true
  }).populate('eventBookingId').sort({ eventDate: 1 });
};

EventTimelineSchema.statics.getPerformanceReport = function(propertyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        propertyId,
        eventDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        onTimeStarts: {
          $sum: { $cond: ['$performance.adherenceToSchedule.onTimeStart', 1, 0] }
        },
        onTimeEnds: {
          $sum: { $cond: ['$performance.adherenceToSchedule.onTimeEnd', 1, 0] }
        },
        averageTaskCompletion: { $avg: '$performance.taskCompletion.completionRate' },
        averageQualityScore: { $avg: '$performance.qualityMetrics.clientSatisfaction' },
        totalIssues: { $sum: '$performance.qualityMetrics.issuesReported' },
        resolvedIssues: { $sum: '$performance.qualityMetrics.issuesResolved' }
      }
    }
  ]);
};

const EventTimeline = models.EventTimeline || model('EventTimeline', EventTimelineSchema);

export default EventTimeline;