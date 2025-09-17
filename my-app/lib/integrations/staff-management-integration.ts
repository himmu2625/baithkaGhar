import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface StaffMember {
  _id?: ObjectId;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    dateOfBirth: Date;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  employment: {
    departmentId: ObjectId;
    roleId: ObjectId;
    title: string;
    startDate: Date;
    endDate?: Date;
    status: 'active' | 'inactive' | 'terminated' | 'on_leave';
    employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
    probationPeriod?: {
      startDate: Date;
      endDate: Date;
      completed: boolean;
    };
  };
  workSchedule: {
    shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
    workingDays: string[];
    hoursPerWeek: number;
    overtimeEligible: boolean;
  };
  compensation: {
    baseSalary: number;
    hourlyRate?: number;
    currency: string;
    payFrequency: 'weekly' | 'bi_weekly' | 'monthly';
    benefits: string[];
  };
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    isActive: boolean;
  }>;
  performance: {
    reviews: Array<{
      date: Date;
      rating: number;
      comments: string;
      reviewedBy: ObjectId;
    }>;
    goals: Array<{
      title: string;
      description: string;
      targetDate: Date;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    }>;
  };
  access: {
    systemAccess: boolean;
    accessLevel: 'basic' | 'advanced' | 'manager' | 'admin';
    permissions: string[];
    lastLogin?: Date;
  };
  documents: Array<{
    type: string;
    filename: string;
    uploadDate: Date;
    isRequired: boolean;
    isVerified: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface ShiftSchedule {
  _id?: ObjectId;
  propertyId: ObjectId;
  staffId: ObjectId;
  date: Date;
  shiftType: string;
  startTime: Date;
  endTime: Date;
  breakDuration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
  approvedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeEntry {
  _id?: ObjectId;
  staffId: ObjectId;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours?: number;
  overtimeHours?: number;
  status: 'clocked_in' | 'on_break' | 'clocked_out' | 'review_required';
  location?: string;
  ipAddress?: string;
  notes?: string;
  approvedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface LeaveRequest {
  _id?: ObjectId;
  staffId: ObjectId;
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'emergency';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: Date;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  replacementStaff?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffManagementIntegration {
  private db: any;

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
  }

  async createStaffMember(staffData: Omit<StaffMember, '_id' | 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<{
    staffId: ObjectId;
    employeeId: string;
    success: boolean;
  }> {
    console.log(`Creating staff member: ${staffData.personalInfo.firstName} ${staffData.personalInfo.lastName}`);

    // Generate employee ID
    const employeeId = await this.generateEmployeeId();

    // Validate department and role exist
    const department = await this.db.collection('departments').findOne({ _id: staffData.employment.departmentId });
    const role = await this.db.collection('staff_roles').findOne({ _id: staffData.employment.roleId });

    if (!department || !role) {
      throw new Error('Invalid department or role');
    }

    // Check for duplicate email
    const existingStaff = await this.db.collection('staff_members').findOne({
      'personalInfo.email': staffData.personalInfo.email
    });

    if (existingStaff) {
      throw new Error('Staff member with this email already exists');
    }

    // Create staff member
    const staffMember: StaffMember = {
      ...staffData,
      employeeId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection('staff_members').insertOne(staffMember);

    // Create initial user account if system access is enabled
    if (staffMember.access.systemAccess) {
      await this.createUserAccount(result.insertedId, staffData.personalInfo.email, staffData.employment.title);
    }

    // Create initial schedule for the next 30 days
    await this.generateInitialSchedule(result.insertedId, staffData.workSchedule);

    console.log(`Staff member created with ID: ${result.insertedId}`);

    return {
      staffId: result.insertedId,
      employeeId,
      success: true
    };
  }

  private async generateEmployeeId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EMP${currentYear}`;

    // Find the highest employee number for current year
    const lastEmployee = await this.db.collection('staff_members')
      .find({ employeeId: { $regex: `^${prefix}` } })
      .sort({ employeeId: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastEmployee.length > 0) {
      const lastNumber = parseInt(lastEmployee[0].employeeId.slice(prefix.length));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async createUserAccount(staffId: ObjectId, email: string, jobTitle: string): Promise<void> {
    // Create user account for system access
    const userAccount = {
      _id: new ObjectId(),
      staffId,
      email,
      username: email,
      temporaryPassword: this.generateTemporaryPassword(),
      role: this.mapJobTitleToRole(jobTitle),
      isActive: true,
      mustChangePassword: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.collection('user_accounts').insertOne(userAccount);

    // TODO: Send welcome email with temporary credentials
    console.log(`User account created for ${email} with temporary password: ${userAccount.temporaryPassword}`);
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private mapJobTitleToRole(jobTitle: string): string {
    const roleMap: Record<string, string> = {
      'General Manager': 'admin',
      'Assistant Manager': 'manager',
      'Front Office Supervisor': 'supervisor',
      'Housekeeping Supervisor': 'supervisor',
      'Chief Engineer': 'manager',
      'Front Desk Agent': 'staff',
      'Room Attendant': 'staff',
      'Maintenance Technician': 'staff'
    };

    return roleMap[jobTitle] || 'staff';
  }

  private async generateInitialSchedule(staffId: ObjectId, workSchedule: StaffMember['workSchedule']): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    const shiftTimes = {
      morning: { start: 8, end: 16 },
      afternoon: { start: 16, end: 24 },
      evening: { start: 18, end: 2 },
      night: { start: 0, end: 8 }
    };

    // Get property ID from staff member
    const staff = await this.db.collection('staff_members').findOne({ _id: staffId });
    const property = await this.db.collection('departments').findOne({ _id: staff.employment.departmentId });

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });

      if (workSchedule.workingDays.includes(dayOfWeek)) {
        const shift = shiftTimes[workSchedule.shiftType] || shiftTimes.morning;

        const startTime = new Date(date);
        startTime.setHours(shift.start, 0, 0, 0);

        const endTime = new Date(date);
        if (shift.end < shift.start) {
          // Next day shift
          endTime.setDate(endTime.getDate() + 1);
        }
        endTime.setHours(shift.end, 0, 0, 0);

        const schedule: ShiftSchedule = {
          propertyId: property.propertyId,
          staffId,
          date: new Date(date),
          shiftType: workSchedule.shiftType,
          startTime,
          endTime,
          breakDuration: 30, // 30 minutes default
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.db.collection('shift_schedules').insertOne(schedule);
      }
    }
  }

  async clockIn(staffId: ObjectId, location?: string, ipAddress?: string): Promise<{
    timeEntryId: ObjectId;
    clockInTime: Date;
    success: boolean;
  }> {
    // Check if staff is already clocked in
    const existingEntry = await this.db.collection('time_entries').findOne({
      staffId,
      date: {
        $gte: this.getStartOfDay(new Date()),
        $lt: this.getEndOfDay(new Date())
      },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (existingEntry) {
      throw new Error('Staff member is already clocked in');
    }

    const clockInTime = new Date();
    const timeEntry: TimeEntry = {
      staffId,
      date: new Date(),
      clockIn: clockInTime,
      status: 'clocked_in',
      location,
      ipAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection('time_entries').insertOne(timeEntry);

    console.log(`Staff ${staffId} clocked in at ${clockInTime}`);

    return {
      timeEntryId: result.insertedId,
      clockInTime,
      success: true
    };
  }

  async clockOut(staffId: ObjectId, notes?: string): Promise<{
    timeEntryId: ObjectId;
    clockOutTime: Date;
    totalHours: number;
    overtimeHours: number;
    success: boolean;
  }> {
    // Find active time entry
    const timeEntry = await this.db.collection('time_entries').findOne({
      staffId,
      date: {
        $gte: this.getStartOfDay(new Date()),
        $lt: this.getEndOfDay(new Date())
      },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (!timeEntry) {
      throw new Error('No active time entry found');
    }

    const clockOutTime = new Date();
    const totalMilliseconds = clockOutTime.getTime() - timeEntry.clockIn.getTime();

    // Subtract break time if applicable
    let breakTime = 0;
    if (timeEntry.breakStart && timeEntry.breakEnd) {
      breakTime = timeEntry.breakEnd.getTime() - timeEntry.breakStart.getTime();
    }

    const workMilliseconds = totalMilliseconds - breakTime;
    const totalHours = workMilliseconds / (1000 * 60 * 60);

    // Calculate overtime (assuming 8-hour standard day)
    const overtimeHours = Math.max(0, totalHours - 8);

    await this.db.collection('time_entries').updateOne(
      { _id: timeEntry._id },
      {
        $set: {
          clockOut: clockOutTime,
          totalHours: Math.round(totalHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          status: 'clocked_out',
          notes,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Staff ${staffId} clocked out at ${clockOutTime}, worked ${totalHours.toFixed(2)} hours`);

    return {
      timeEntryId: timeEntry._id,
      clockOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      success: true
    };
  }

  async requestLeave(leaveRequest: Omit<LeaveRequest, '_id' | 'createdAt' | 'updatedAt'>): Promise<{
    requestId: ObjectId;
    success: boolean;
  }> {
    // Calculate total days
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave: LeaveRequest = {
      ...leaveRequest,
      totalDays,
      status: 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection('leave_requests').insertOne(leave);

    // Notify supervisors
    await this.notifyLeaveRequest(result.insertedId, leaveRequest.staffId);

    console.log(`Leave request created for staff ${leaveRequest.staffId}`);

    return {
      requestId: result.insertedId,
      success: true
    };
  }

  private async notifyLeaveRequest(requestId: ObjectId, staffId: ObjectId): Promise<void> {
    // Get staff member details
    const staff = await this.db.collection('staff_members').findOne({ _id: staffId });
    if (!staff) return;

    // Find supervisors in the same department
    const supervisors = await this.db.collection('staff_members').find({
      'employment.departmentId': staff.employment.departmentId,
      'access.accessLevel': { $in: ['manager', 'admin'] },
      'employment.status': 'active'
    }).toArray();

    // Create notifications
    for (const supervisor of supervisors) {
      const notification = {
        recipientId: supervisor._id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${staff.personalInfo.firstName} ${staff.personalInfo.lastName} has submitted a leave request`,
        data: {
          leaveRequestId: requestId,
          staffId: staffId,
          staffName: `${staff.personalInfo.firstName} ${staff.personalInfo.lastName}`
        },
        isRead: false,
        createdAt: new Date()
      };

      await this.db.collection('notifications').insertOne(notification);
    }
  }

  async getStaffSchedule(staffId: ObjectId, startDate: Date, endDate: Date): Promise<ShiftSchedule[]> {
    return await this.db.collection('shift_schedules').find({
      staffId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).toArray();
  }

  async getStaffTimeEntries(staffId: ObjectId, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return await this.db.collection('time_entries').find({
      staffId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).toArray();
  }

  async generatePayrollReport(startDate: Date, endDate: Date): Promise<{
    totalStaff: number;
    totalHours: number;
    totalOvertimeHours: number;
    totalRegularPay: number;
    totalOvertimePay: number;
    totalPay: number;
    staffDetails: Array<{
      staffId: ObjectId;
      employeeId: string;
      name: string;
      regularHours: number;
      overtimeHours: number;
      regularPay: number;
      overtimePay: number;
      totalPay: number;
    }>;
  }> {
    // Get all active staff members
    const staff = await this.db.collection('staff_members').find({
      'employment.status': 'active'
    }).toArray();

    const staffDetails = [];
    let totalHours = 0;
    let totalOvertimeHours = 0;
    let totalRegularPay = 0;
    let totalOvertimePay = 0;

    for (const member of staff) {
      // Get time entries for the period
      const timeEntries = await this.db.collection('time_entries').find({
        staffId: member._id,
        date: { $gte: startDate, $lte: endDate },
        status: 'clocked_out'
      }).toArray();

      const regularHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours - entry.overtimeHours), 0);
      const overtimeHours = timeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0);

      const hourlyRate = member.compensation.hourlyRate || member.compensation.baseSalary / 2080; // Assume 2080 hours per year
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.5;

      staffDetails.push({
        staffId: member._id,
        employeeId: member.employeeId,
        name: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`,
        regularHours: Math.round(regularHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        regularPay: Math.round(regularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        totalPay: Math.round((regularPay + overtimePay) * 100) / 100
      });

      totalHours += regularHours + overtimeHours;
      totalOvertimeHours += overtimeHours;
      totalRegularPay += regularPay;
      totalOvertimePay += overtimePay;
    }

    return {
      totalStaff: staff.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalRegularPay: Math.round(totalRegularPay * 100) / 100,
      totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
      totalPay: Math.round((totalRegularPay + totalOvertimePay) * 100) / 100,
      staffDetails
    };
  }

  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  async getStaffStatistics(): Promise<{
    totalStaff: number;
    activeStaff: number;
    departmentBreakdown: Array<{ department: string; count: number }>;
    averageExperience: number;
    upcomingReviews: number;
    pendingLeaveRequests: number;
  }> {
    const totalStaff = await this.db.collection('staff_members').countDocuments();
    const activeStaff = await this.db.collection('staff_members').countDocuments({
      'employment.status': 'active'
    });

    // Department breakdown
    const departmentStats = await this.db.collection('staff_members').aggregate([
      {
        $match: { 'employment.status': 'active' }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employment.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $group: {
          _id: '$department.name',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const departmentBreakdown = departmentStats.map(dept => ({
      department: dept._id,
      count: dept.count
    }));

    // Calculate average experience
    const experienceStats = await this.db.collection('staff_members').aggregate([
      {
        $match: { 'employment.status': 'active' }
      },
      {
        $project: {
          experience: {
            $divide: [
              { $subtract: [new Date(), '$employment.startDate'] },
              1000 * 60 * 60 * 24 * 365 // Convert to years
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageExperience: { $avg: '$experience' }
        }
      }
    ]).toArray();

    const averageExperience = experienceStats[0]?.averageExperience || 0;

    // Upcoming reviews (90 days)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const upcomingReviews = await this.db.collection('staff_members').countDocuments({
      'employment.status': 'active',
      'probationPeriod.endDate': { $lte: ninetyDaysFromNow, $gte: new Date() },
      'probationPeriod.completed': false
    });

    // Pending leave requests
    const pendingLeaveRequests = await this.db.collection('leave_requests').countDocuments({
      status: 'pending'
    });

    return {
      totalStaff,
      activeStaff,
      departmentBreakdown,
      averageExperience: Math.round(averageExperience * 100) / 100,
      upcomingReviews,
      pendingLeaveRequests
    };
  }
}

export async function initializeStaffManagement() {
  const staffManagement = new StaffManagementIntegration();
  await staffManagement.initialize();

  console.log('Staff management system initialized');
  return staffManagement;
}