import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ScheduleTemplate {
  name: string;
  description: string;
  roomTypes: string[];
  tasks: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    estimatedDuration: number; // in minutes
    frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed' | 'checkout' | 'checkin';
    instructions: string[];
    checklist: Array<{
      item: string;
      required: boolean;
      estimatedTime: number;
    }>;
    requiredSkills: string[];
    tools: string[];
    supplies: string[];
  }>;
}

interface StaffMember {
  _id?: ObjectId;
  name: string;
  role: 'housekeeper' | 'supervisor' | 'maintenance';
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  skills: string[];
  maxRoomsPerDay: number;
  workingDays: string[];
  isActive: boolean;
}

export class HousekeepingScheduleSetup {
  private db: any;

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
  }

  async setupInitialSchedules(): Promise<{
    templatesCreated: number;
    schedulesCreated: number;
    staffCreated: number;
    summary: string;
  }> {
    console.log('Setting up initial housekeeping schedules...');

    // Create schedule templates
    const templates = await this.createScheduleTemplates();

    // Create default staff members
    const staff = await this.createDefaultStaff();

    // Generate schedules for existing rooms
    const schedules = await this.generateRoomSchedules(templates, staff);

    return {
      templatesCreated: templates.length,
      schedulesCreated: schedules,
      staffCreated: staff.length,
      summary: `Setup completed: ${templates.length} templates, ${schedules} schedules, ${staff.length} staff members`
    };
  }

  private async createScheduleTemplates(): Promise<ScheduleTemplate[]> {
    const templates: ScheduleTemplate[] = [
      {
        name: 'Standard Room Cleaning',
        description: 'Regular cleaning routine for standard guest rooms',
        roomTypes: ['standard', 'deluxe'],
        tasks: [
          {
            type: 'checkout_cleaning',
            priority: 'high',
            estimatedDuration: 45,
            frequency: 'checkout',
            instructions: [
              'Strip and replace all bed linens',
              'Clean and sanitize bathroom thoroughly',
              'Vacuum carpets and mop hard floors',
              'Dust all surfaces and furniture',
              'Restock amenities and supplies',
              'Check all equipment and report issues'
            ],
            checklist: [
              { item: 'Remove used linens and towels', required: true, estimatedTime: 3 },
              { item: 'Make beds with fresh linens', required: true, estimatedTime: 8 },
              { item: 'Clean bathroom (sink, toilet, shower/tub)', required: true, estimatedTime: 12 },
              { item: 'Vacuum carpet/mop floors', required: true, estimatedTime: 10 },
              { item: 'Dust furniture and surfaces', required: true, estimatedTime: 8 },
              { item: 'Clean windows and mirrors', required: false, estimatedTime: 4 },
              { item: 'Restock toilet paper, towels, amenities', required: true, estimatedTime: 3 },
              { item: 'Empty trash and replace liners', required: true, estimatedTime: 2 },
              { item: 'Check TV, AC, lighting functionality', required: true, estimatedTime: 2 },
              { item: 'Final inspection and quality check', required: true, estimatedTime: 3 }
            ],
            requiredSkills: ['basic_cleaning', 'bed_making', 'bathroom_sanitization'],
            tools: ['vacuum', 'mop', 'cleaning_cart', 'microfiber_cloths'],
            supplies: ['all_purpose_cleaner', 'bathroom_cleaner', 'glass_cleaner', 'fresh_linens', 'towels']
          },
          {
            type: 'maintenance_check',
            priority: 'medium',
            estimatedDuration: 15,
            frequency: 'weekly',
            instructions: [
              'Inspect all room equipment and fixtures',
              'Test electrical outlets and lighting',
              'Check plumbing for leaks or issues',
              'Report any maintenance needs'
            ],
            checklist: [
              { item: 'Test all light switches and bulbs', required: true, estimatedTime: 3 },
              { item: 'Check electrical outlets', required: true, estimatedTime: 2 },
              { item: 'Inspect bathroom fixtures', required: true, estimatedTime: 4 },
              { item: 'Check furniture condition', required: true, estimatedTime: 3 },
              { item: 'Test TV and remote', required: true, estimatedTime: 2 },
              { item: 'Document any issues found', required: true, estimatedTime: 1 }
            ],
            requiredSkills: ['basic_maintenance', 'equipment_inspection'],
            tools: ['flashlight', 'basic_tools', 'inspection_checklist'],
            supplies: []
          }
        ]
      },
      {
        name: 'Suite Deep Cleaning',
        description: 'Comprehensive cleaning for suites and premium rooms',
        roomTypes: ['suite', 'family'],
        tasks: [
          {
            type: 'deep_clean',
            priority: 'high',
            estimatedDuration: 75,
            frequency: 'checkout',
            instructions: [
              'Complete standard cleaning plus additional suite areas',
              'Clean kitchen area (if applicable)',
              'Deep clean living area',
              'Clean multiple bedrooms/bathrooms',
              'Extra attention to high-touch surfaces'
            ],
            checklist: [
              { item: 'Clean all bedrooms (beds, linens)', required: true, estimatedTime: 15 },
              { item: 'Clean all bathrooms thoroughly', required: true, estimatedTime: 20 },
              { item: 'Clean living/sitting area', required: true, estimatedTime: 15 },
              { item: 'Clean kitchen area (if present)', required: false, estimatedTime: 10 },
              { item: 'Vacuum/clean all floor areas', required: true, estimatedTime: 12 },
              { item: 'Dust and polish all furniture', required: true, estimatedTime: 10 },
              { item: 'Clean windows and balcony (if present)', required: false, estimatedTime: 8 },
              { item: 'Restock all amenities and supplies', required: true, estimatedTime: 5 }
            ],
            requiredSkills: ['advanced_cleaning', 'kitchen_cleaning', 'upholstery_care'],
            tools: ['vacuum', 'steam_cleaner', 'upholstery_cleaner', 'window_squeegee'],
            supplies: ['premium_cleaners', 'luxury_linens', 'enhanced_amenities']
          }
        ]
      },
      {
        name: 'Accessible Room Care',
        description: 'Specialized cleaning for accessible rooms with specific requirements',
        roomTypes: ['accessible'],
        tasks: [
          {
            type: 'accessible_cleaning',
            priority: 'high',
            estimatedDuration: 50,
            frequency: 'checkout',
            instructions: [
              'Follow ADA compliance cleaning procedures',
              'Pay special attention to grab bars and accessibility features',
              'Ensure clear pathways and proper equipment placement',
              'Use appropriate cleaning products safe for sensitive users'
            ],
            checklist: [
              { item: 'Clean and sanitize grab bars', required: true, estimatedTime: 5 },
              { item: 'Ensure wheelchair accessibility paths', required: true, estimatedTime: 3 },
              { item: 'Check accessibility equipment function', required: true, estimatedTime: 7 },
              { item: 'Standard room cleaning procedures', required: true, estimatedTime: 35 }
            ],
            requiredSkills: ['accessibility_cleaning', 'ada_compliance'],
            tools: ['specialized_cleaning_tools', 'accessibility_checklist'],
            supplies: ['hypoallergenic_cleaners', 'specialized_amenities']
          }
        ]
      },
      {
        name: 'Daily Maintenance Tasks',
        description: 'Routine daily maintenance and inspection tasks',
        roomTypes: ['all'],
        tasks: [
          {
            type: 'daily_inspection',
            priority: 'medium',
            estimatedDuration: 10,
            frequency: 'daily',
            instructions: [
              'Visual inspection of room condition',
              'Check for any obvious maintenance needs',
              'Verify room status accuracy',
              'Report any issues immediately'
            ],
            checklist: [
              { item: 'Check room status matches system', required: true, estimatedTime: 1 },
              { item: 'Visual inspection for damages', required: true, estimatedTime: 3 },
              { item: 'Check temperature and lighting', required: true, estimatedTime: 2 },
              { item: 'Verify inventory completeness', required: true, estimatedTime: 3 },
              { item: 'Update room status if needed', required: true, estimatedTime: 1 }
            ],
            requiredSkills: ['visual_inspection', 'system_operation'],
            tools: ['mobile_device', 'inspection_form'],
            supplies: []
          }
        ]
      }
    ];

    // Insert templates into database
    for (const template of templates) {
      await this.db.collection('housekeeping_templates').insertOne({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    }

    console.log(`Created ${templates.length} schedule templates`);
    return templates;
  }

  private async createDefaultStaff(): Promise<StaffMember[]> {
    const staff: StaffMember[] = [
      {
        name: 'Maria Rodriguez',
        role: 'housekeeper',
        shift: 'morning',
        skills: ['basic_cleaning', 'bed_making', 'bathroom_sanitization', 'inventory_management'],
        maxRoomsPerDay: 12,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isActive: true
      },
      {
        name: 'James Chen',
        role: 'housekeeper',
        shift: 'morning',
        skills: ['advanced_cleaning', 'kitchen_cleaning', 'upholstery_care', 'window_cleaning'],
        maxRoomsPerDay: 10,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        role: 'supervisor',
        shift: 'morning',
        skills: ['quality_control', 'staff_management', 'advanced_cleaning', 'training'],
        maxRoomsPerDay: 8,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        isActive: true
      },
      {
        name: 'Ahmed Hassan',
        role: 'housekeeper',
        shift: 'afternoon',
        skills: ['basic_cleaning', 'maintenance_check', 'accessibility_cleaning', 'ada_compliance'],
        maxRoomsPerDay: 11,
        workingDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true
      },
      {
        name: 'Lisa Park',
        role: 'housekeeper',
        shift: 'afternoon',
        skills: ['basic_cleaning', 'bed_making', 'bathroom_sanitization', 'deep_cleaning'],
        maxRoomsPerDay: 10,
        workingDays: ['monday', 'wednesday', 'friday', 'saturday', 'sunday'],
        isActive: true
      },
      {
        name: 'Roberto Silva',
        role: 'maintenance',
        shift: 'morning',
        skills: ['basic_maintenance', 'equipment_inspection', 'electrical_check', 'plumbing_check'],
        maxRoomsPerDay: 20,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isActive: true
      }
    ];

    // Insert staff into database
    const staffResults = await this.db.collection('staff_members').insertMany(
      staff.map(member => ({
        ...member,
        employeeId: this.generateEmployeeId(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    // Update staff array with inserted IDs
    staff.forEach((member, index) => {
      member._id = staffResults.insertedIds[index];
    });

    console.log(`Created ${staff.length} staff members`);
    return staff;
  }

  private generateEmployeeId(): string {
    return 'EMP' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  }

  private async generateRoomSchedules(templates: ScheduleTemplate[], staff: StaffMember[]): Promise<number> {
    // Get all rooms from database
    const rooms = await this.db.collection('rooms').find({ status: { $ne: 'out_of_order' } }).toArray();

    if (rooms.length === 0) {
      console.log('No rooms found to schedule');
      return 0;
    }

    let schedulesCreated = 0;
    const currentDate = new Date();

    // Generate schedules for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const scheduleDate = new Date(currentDate);
      scheduleDate.setDate(currentDate.getDate() + dayOffset);
      scheduleDate.setHours(0, 0, 0, 0);

      const dayOfWeek = scheduleDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

      // Filter available staff for this day
      const availableStaff = staff.filter(member =>
        member.workingDays.includes(dayOfWeek) && member.isActive
      );

      if (availableStaff.length === 0) {
        continue;
      }

      // Distribute rooms among available staff
      const roomAssignments = this.distributeRooms(rooms, availableStaff);

      // Create tasks for each room assignment
      for (const assignment of roomAssignments) {
        const template = this.getTemplateForRoom(templates, assignment.room);
        if (!template) continue;

        for (const taskTemplate of template.tasks) {
          // Only schedule relevant tasks based on frequency
          if (!this.shouldScheduleTask(taskTemplate, scheduleDate, assignment.room)) {
            continue;
          }

          const task = {
            propertyId: assignment.room.propertyId,
            roomId: assignment.room._id,
            roomNumber: assignment.room.number,
            type: taskTemplate.type,
            title: `${taskTemplate.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - Room ${assignment.room.number}`,
            description: template.description,
            priority: taskTemplate.priority,
            status: 'scheduled',
            estimatedDuration: taskTemplate.estimatedDuration,
            assignedTo: assignment.staffMember._id,
            assignedToName: assignment.staffMember.name,
            scheduledDate: scheduleDate,
            scheduledTime: this.calculateScheduledTime(assignment.staffMember.shift, assignment.taskOrder),
            instructions: taskTemplate.instructions,
            checklist: taskTemplate.checklist.map(item => ({
              ...item,
              id: crypto.randomUUID(),
              completed: false,
              completedAt: null,
              completedBy: null
            })),
            requiredSkills: taskTemplate.requiredSkills,
            tools: taskTemplate.tools,
            supplies: taskTemplate.supplies,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'initial_setup'
          };

          await this.db.collection('housekeeping_tasks').insertOne(task);
          schedulesCreated++;
        }
      }
    }

    console.log(`Generated ${schedulesCreated} scheduled tasks`);
    return schedulesCreated;
  }

  private distributeRooms(rooms: any[], staff: StaffMember[]): Array<{
    room: any;
    staffMember: StaffMember;
    taskOrder: number;
  }> {
    const assignments: Array<{
      room: any;
      staffMember: StaffMember;
      taskOrder: number;
    }> = [];

    // Sort staff by availability (fewer assigned rooms first)
    const staffWorkload = new Map(staff.map(member => [member._id!.toString(), 0]));

    // Distribute rooms round-robin style
    let staffIndex = 0;

    for (const room of rooms) {
      // Find staff member with appropriate skills
      let selectedStaff = staff[staffIndex % staff.length];

      // Prefer staff with matching skills for special room types
      if (room.type === 'suite' || room.type === 'family') {
        const suiteSkilledStaff = staff.find(member =>
          member.skills.includes('advanced_cleaning') || member.skills.includes('kitchen_cleaning')
        );
        if (suiteSkilledStaff) selectedStaff = suiteSkilledStaff;
      }

      if (room.type === 'accessible') {
        const accessibleSkilledStaff = staff.find(member =>
          member.skills.includes('accessibility_cleaning') || member.skills.includes('ada_compliance')
        );
        if (accessibleSkilledStaff) selectedStaff = accessibleSkilledStaff;
      }

      // Check if staff member hasn't exceeded max rooms per day
      const currentWorkload = staffWorkload.get(selectedStaff._id!.toString()) || 0;
      if (currentWorkload >= selectedStaff.maxRoomsPerDay) {
        // Find another staff member with capacity
        const alternativeStaff = staff.find(member => {
          const workload = staffWorkload.get(member._id!.toString()) || 0;
          return workload < member.maxRoomsPerDay;
        });

        if (alternativeStaff) {
          selectedStaff = alternativeStaff;
        }
      }

      const taskOrder = staffWorkload.get(selectedStaff._id!.toString()) || 0;

      assignments.push({
        room,
        staffMember: selectedStaff,
        taskOrder: taskOrder + 1
      });

      // Update workload
      staffWorkload.set(selectedStaff._id!.toString(), taskOrder + 1);
      staffIndex++;
    }

    return assignments;
  }

  private getTemplateForRoom(templates: ScheduleTemplate[], room: any): ScheduleTemplate | null {
    return templates.find(template =>
      template.roomTypes.includes(room.type) || template.roomTypes.includes('all')
    ) || null;
  }

  private shouldScheduleTask(taskTemplate: any, scheduleDate: Date, room: any): boolean {
    const dayOfWeek = scheduleDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    switch (taskTemplate.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return dayOfWeek === 1; // Monday
      case 'monthly':
        return scheduleDate.getDate() === 1; // First of month
      case 'checkout':
        // For initial setup, assume some rooms need checkout cleaning
        return room.status === 'cleaning' || Math.random() < 0.3;
      case 'checkin':
        // For initial setup, assume some rooms need pre-checkin inspection
        return room.status === 'available' && Math.random() < 0.2;
      case 'as_needed':
        // For initial setup, randomly assign some as-needed tasks
        return Math.random() < 0.1;
      default:
        return false;
    }
  }

  private calculateScheduledTime(shift: string, taskOrder: number): Date {
    const baseTime = new Date();
    baseTime.setSeconds(0, 0);

    switch (shift) {
      case 'morning':
        baseTime.setHours(8, 0, 0, 0); // Start at 8 AM
        break;
      case 'afternoon':
        baseTime.setHours(14, 0, 0, 0); // Start at 2 PM
        break;
      case 'evening':
        baseTime.setHours(18, 0, 0, 0); // Start at 6 PM
        break;
      case 'night':
        baseTime.setHours(22, 0, 0, 0); // Start at 10 PM
        break;
      default:
        baseTime.setHours(9, 0, 0, 0); // Default 9 AM
    }

    // Add time based on task order (assuming 45 minutes per task average)
    baseTime.setMinutes(baseTime.getMinutes() + (taskOrder - 1) * 45);

    return baseTime;
  }

  async createRecurringScheduleRules(): Promise<void> {
    console.log('Creating recurring schedule rules...');

    const rules = [
      {
        name: 'Daily Room Inspections',
        description: 'Daily visual inspections for all rooms',
        frequency: 'daily',
        time: '09:00',
        roomTypes: ['all'],
        taskType: 'daily_inspection',
        priority: 'medium',
        assignmentRule: 'round_robin',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Checkout Cleaning',
        description: 'Clean rooms after guest checkout',
        frequency: 'on_checkout',
        time: 'immediate',
        roomTypes: ['all'],
        taskType: 'checkout_cleaning',
        priority: 'high',
        assignmentRule: 'skill_based',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Weekly Maintenance Check',
        description: 'Weekly maintenance inspection for all rooms',
        frequency: 'weekly',
        time: '10:00',
        dayOfWeek: 'monday',
        roomTypes: ['all'],
        taskType: 'maintenance_check',
        priority: 'medium',
        assignmentRule: 'maintenance_staff',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Deep Clean Schedule',
        description: 'Monthly deep cleaning for all rooms',
        frequency: 'monthly',
        time: '08:00',
        dayOfMonth: 1,
        roomTypes: ['all'],
        taskType: 'deep_clean',
        priority: 'medium',
        assignmentRule: 'experienced_staff',
        isActive: true,
        createdAt: new Date()
      }
    ];

    await this.db.collection('schedule_rules').insertMany(rules);
    console.log(`Created ${rules.length} recurring schedule rules`);
  }

  async generateSupplyRequirements(): Promise<void> {
    console.log('Generating supply requirements...');

    const supplies = [
      {
        name: 'All-Purpose Cleaner',
        category: 'cleaning_supplies',
        unit: 'bottles',
        costPerUnit: 4.99,
        supplier: 'CleanCorp Solutions',
        consumptionRate: {
          perRoom: 0.1,
          perTask: 0.05
        },
        minimumStock: 50,
        maximumStock: 200,
        reorderPoint: 75,
        isActive: true
      },
      {
        name: 'Bathroom Cleaner',
        category: 'cleaning_supplies',
        unit: 'bottles',
        costPerUnit: 6.49,
        supplier: 'CleanCorp Solutions',
        consumptionRate: {
          perRoom: 0.15,
          perTask: 0.08
        },
        minimumStock: 30,
        maximumStock: 120,
        reorderPoint: 45,
        isActive: true
      },
      {
        name: 'Microfiber Cloths',
        category: 'cleaning_tools',
        unit: 'pieces',
        costPerUnit: 1.99,
        supplier: 'Supply Plus',
        consumptionRate: {
          perRoom: 2,
          perTask: 1
        },
        minimumStock: 100,
        maximumStock: 500,
        reorderPoint: 150,
        isActive: true
      },
      {
        name: 'Bed Sheets (Queen)',
        category: 'linens',
        unit: 'sets',
        costPerUnit: 29.99,
        supplier: 'Hotel Linens Direct',
        consumptionRate: {
          perRoom: 3, // 3 sets per room for rotation
          perTask: 1
        },
        minimumStock: 50,
        maximumStock: 200,
        reorderPoint: 75,
        isActive: true
      },
      {
        name: 'Bath Towels',
        category: 'linens',
        unit: 'pieces',
        costPerUnit: 12.99,
        supplier: 'Hotel Linens Direct',
        consumptionRate: {
          perRoom: 6, // Multiple towels per room
          perTask: 2
        },
        minimumStock: 100,
        maximumStock: 400,
        reorderPoint: 150,
        isActive: true
      }
    ];

    await this.db.collection('supply_catalog').insertMany(
      supplies.map(supply => ({
        ...supply,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    console.log(`Generated ${supplies.length} supply requirements`);
  }

  async validateSetup(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      totalTemplates: number;
      totalStaff: number;
      totalScheduledTasks: number;
      activeDays: number;
    };
  }> {
    const issues: string[] = [];

    // Check templates
    const totalTemplates = await this.db.collection('housekeeping_templates').countDocuments({ isActive: true });
    if (totalTemplates === 0) {
      issues.push('No active housekeeping templates found');
    }

    // Check staff
    const totalStaff = await this.db.collection('staff_members').countDocuments({ isActive: true });
    if (totalStaff === 0) {
      issues.push('No active staff members found');
    }

    // Check scheduled tasks
    const totalScheduledTasks = await this.db.collection('housekeeping_tasks').countDocuments({ status: 'scheduled' });
    if (totalScheduledTasks === 0) {
      issues.push('No scheduled tasks found');
    }

    // Check for scheduling conflicts
    const conflicts = await this.db.collection('housekeeping_tasks').aggregate([
      {
        $match: {
          status: 'scheduled',
          scheduledDate: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: {
            assignedTo: '$assignedTo',
            scheduledTime: '$scheduledTime'
          },
          count: { $sum: 1 },
          tasks: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();

    if (conflicts.length > 0) {
      issues.push(`Found ${conflicts.length} scheduling conflicts`);
    }

    // Count active days
    const activeDays = await this.db.collection('housekeeping_tasks').distinct('scheduledDate', {
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    });

    return {
      isValid: issues.length === 0,
      issues,
      statistics: {
        totalTemplates,
        totalStaff,
        totalScheduledTasks,
        activeDays: activeDays.length
      }
    };
  }
}

// CLI usage
export async function runHousekeepingSetup() {
  const setup = new HousekeepingScheduleSetup();
  await setup.initialize();

  try {
    const result = await setup.setupInitialSchedules();
    console.log('Housekeeping setup completed:', result);

    await setup.createRecurringScheduleRules();
    await setup.generateSupplyRequirements();

    const validation = await setup.validateSetup();
    console.log('Setup validation:', validation);

    return { setup: result, validation };
  } catch (error) {
    console.error('Housekeeping setup failed:', error);
    throw error;
  }
}