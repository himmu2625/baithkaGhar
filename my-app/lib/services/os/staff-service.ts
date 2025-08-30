import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import { auditLogger } from '@/lib/security/audit-logger'
import mongoose from 'mongoose'

export interface StaffMember {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: 'housekeeping' | 'front_desk' | 'maintenance' | 'management' | 'food_service' | 'security'
  role: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  hireDate: Date
  salary?: number
  hourlyRate?: number
  permissions: string[]
  supervisor?: string
  shifts: ShiftSchedule[]
  propertyId: string
  createdAt: Date
  updatedAt: Date
}

export interface ShiftSchedule {
  id: string
  staffId: string
  date: Date
  startTime: string
  endTime: string
  department: string
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'absent' | 'late'
  actualStartTime?: Date
  actualEndTime?: Date
  notes?: string
  checkedInBy?: string
  checkedOutBy?: string
}

export interface StaffTask {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedBy: string
  department: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: Date
  estimatedDuration: number
  actualDuration?: number
  roomNumbers?: string[]
  propertyId: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface StaffPerformance {
  staffId: string
  month: number
  year: number
  hoursWorked: number
  hoursScheduled: number
  attendanceRate: number
  tasksCompleted: number
  tasksAssigned: number
  taskCompletionRate: number
  averageTaskRating: number
  customerRatings: number[]
  punctualityScore: number
  notes: string[]
  propertyId: string
}

export interface StaffWorkflow {
  id: string
  name: string
  department: string
  triggerType: 'manual' | 'scheduled' | 'event_based'
  triggerConditions?: any
  steps: WorkflowStep[]
  isActive: boolean
  propertyId: string
  createdAt: Date
}

export interface WorkflowStep {
  id: string
  order: number
  title: string
  description: string
  assignedRole: string
  estimatedDuration: number
  requiredSkills: string[]
  dependencies: string[]
  isOptional: boolean
}

export interface StaffFilters {
  department?: string
  role?: string
  status?: string
  propertyId?: string
  search?: string
  page?: number
  limit?: number
}

export interface TaskFilters {
  assignedTo?: string
  department?: string
  status?: string
  priority?: string
  dateRange?: { start: Date; end: Date }
  propertyId?: string
  page?: number
  limit?: number
}

export class StaffService {
  // Staff Management
  
  static async createStaffMember(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean
    data?: StaffMember
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate employee ID
      const employeeId = await this.generateEmployeeId(staffData.propertyId)
      
      const newStaff: StaffMember = {
        ...staffData,
        id: new mongoose.Types.ObjectId().toString(),
        employeeId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // In production, save to database
      console.log('Creating staff member:', newStaff.firstName, newStaff.lastName)
      
      await auditLogger.logUserAction({
        userId: 'system',
        action: 'create_staff_member',
        resource: 'staff',
        resourceId: newStaff.id,
        ip: 'internal',
        userAgent: 'system',
        details: {
          employeeId: newStaff.employeeId,
          department: newStaff.department,
          role: newStaff.role
        }
      })
      
      return { success: true, data: newStaff }
      
    } catch (error) {
      console.error('Error creating staff member:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async getStaffMembers(filters: StaffFilters = {}): Promise<{
    success: boolean
    data?: {
      staff: StaffMember[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
      summary: {
        totalStaff: number
        activeStaff: number
        byDepartment: { [key: string]: number }
        byStatus: { [key: string]: number }
      }
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const { page = 1, limit = 20, propertyId } = filters
      
      // In production, query from database
      const mockStaff: StaffMember[] = []
      
      // Generate mock staff data
      const departments = ['housekeeping', 'front_desk', 'maintenance', 'management', 'food_service', 'security']
      const statuses = ['active', 'inactive', 'on_leave']
      
      for (let i = 0; i < 50; i++) {
        mockStaff.push({
          id: `staff_${i}`,
          employeeId: `EMP${String(i + 1000).padStart(4, '0')}`,
          firstName: `FirstName${i}`,
          lastName: `LastName${i}`,
          email: `staff${i}@property.com`,
          phone: `+1234567${String(i).padStart(3, '0')}`,
          department: departments[Math.floor(Math.random() * departments.length)] as any,
          role: `Role ${i}`,
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          hourlyRate: 15 + Math.random() * 20,
          permissions: [`permission_${i}`, `permission_${i + 1}`],
          shifts: [],
          propertyId: propertyId || 'default_property',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      // Apply filters
      let filteredStaff = mockStaff
      if (filters.department) {
        filteredStaff = filteredStaff.filter(s => s.department === filters.department)
      }
      if (filters.status) {
        filteredStaff = filteredStaff.filter(s => s.status === filters.status)
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredStaff = filteredStaff.filter(s => 
          s.firstName.toLowerCase().includes(search) ||
          s.lastName.toLowerCase().includes(search) ||
          s.employeeId.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search)
        )
      }
      
      const total = filteredStaff.length
      const skip = (page - 1) * limit
      const staff = filteredStaff.slice(skip, skip + limit)
      
      const summary = {
        totalStaff: mockStaff.length,
        activeStaff: mockStaff.filter(s => s.status === 'active').length,
        byDepartment: this.groupBy(mockStaff, 'department'),
        byStatus: this.groupBy(mockStaff, 'status')
      }
      
      return {
        success: true,
        data: {
          staff,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          summary
        }
      }
      
    } catch (error) {
      console.error('Error fetching staff members:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async updateStaffMember(staffId: string, updates: Partial<StaffMember>): Promise<{
    success: boolean
    data?: StaffMember
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // In production, update in database
      console.log('Updating staff member:', staffId, updates)
      
      await auditLogger.logUserAction({
        userId: 'system',
        action: 'update_staff_member',
        resource: 'staff',
        resourceId: staffId,
        ip: 'internal',
        userAgent: 'system',
        details: updates
      })
      
      // Return mock updated staff
      const updatedStaff: StaffMember = {
        id: staffId,
        employeeId: 'EMP1001',
        firstName: 'Updated',
        lastName: 'Staff',
        email: 'updated@property.com',
        phone: '+1234567890',
        department: 'housekeeping',
        role: 'Housekeeper',
        status: 'active',
        hireDate: new Date(),
        hourlyRate: 20,
        permissions: ['view_rooms', 'update_room_status'],
        shifts: [],
        propertyId: 'property_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates
      }
      
      return { success: true, data: updatedStaff }
      
    } catch (error) {
      console.error('Error updating staff member:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Shift Scheduling
  
  static async createShift(shiftData: Omit<ShiftSchedule, 'id'>): Promise<{
    success: boolean
    data?: ShiftSchedule
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newShift: ShiftSchedule = {
        ...shiftData,
        id: new mongoose.Types.ObjectId().toString()
      }
      
      console.log('Creating shift:', newShift.staffId, newShift.date)
      
      return { success: true, data: newShift }
      
    } catch (error) {
      console.error('Error creating shift:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async getShiftSchedule(propertyId: string, dateRange: { start: Date; end: Date }): Promise<{
    success: boolean
    data?: ShiftSchedule[]
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate mock shift data
      const shifts: ShiftSchedule[] = []
      const departments = ['housekeeping', 'front_desk', 'maintenance']
      
      for (let i = 0; i < 20; i++) {
        shifts.push({
          id: `shift_${i}`,
          staffId: `staff_${i % 10}`,
          date: new Date(dateRange.start.getTime() + Math.random() * (dateRange.end.getTime() - dateRange.start.getTime())),
          startTime: '09:00',
          endTime: '17:00',
          department: departments[Math.floor(Math.random() * departments.length)],
          status: Math.random() > 0.5 ? 'scheduled' : 'checked_in'
        })
      }
      
      return { success: true, data: shifts }
      
    } catch (error) {
      console.error('Error fetching shift schedule:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async checkInStaff(shiftId: string, checkedInBy: string): Promise<{
    success: boolean
    data?: ShiftSchedule
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Checking in staff for shift:', shiftId)
      
      await auditLogger.logUserAction({
        userId: checkedInBy,
        action: 'staff_check_in',
        resource: 'shift',
        resourceId: shiftId,
        ip: 'internal',
        userAgent: 'system',
        details: { checkedInAt: new Date() }
      })
      
      const updatedShift: ShiftSchedule = {
        id: shiftId,
        staffId: 'staff_1',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        department: 'housekeeping',
        status: 'checked_in',
        actualStartTime: new Date(),
        checkedInBy
      }
      
      return { success: true, data: updatedShift }
      
    } catch (error) {
      console.error('Error checking in staff:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Task Management
  
  static async createTask(taskData: Omit<StaffTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean
    data?: StaffTask
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newTask: StaffTask = {
        ...taskData,
        id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Creating task:', newTask.title)
      
      await auditLogger.logUserAction({
        userId: taskData.assignedBy,
        action: 'create_task',
        resource: 'staff_task',
        resourceId: newTask.id,
        ip: 'internal',
        userAgent: 'system',
        details: {
          assignedTo: taskData.assignedTo,
          department: taskData.department,
          priority: taskData.priority
        }
      })
      
      return { success: true, data: newTask }
      
    } catch (error) {
      console.error('Error creating task:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async getTasks(filters: TaskFilters = {}): Promise<{
    success: boolean
    data?: {
      tasks: StaffTask[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
      summary: {
        totalTasks: number
        pendingTasks: number
        completedTasks: number
        byPriority: { [key: string]: number }
        byDepartment: { [key: string]: number }
      }
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const { page = 1, limit = 20 } = filters
      
      // Generate mock task data
      const mockTasks: StaffTask[] = []
      const departments = ['housekeeping', 'front_desk', 'maintenance']
      const priorities = ['low', 'medium', 'high', 'urgent']
      const statuses = ['pending', 'in_progress', 'completed']
      
      for (let i = 0; i < 30; i++) {
        mockTasks.push({
          id: `task_${i}`,
          title: `Task ${i + 1}`,
          description: `Description for task ${i + 1}`,
          assignedTo: `staff_${i % 10}`,
          assignedBy: 'manager_1',
          department: departments[Math.floor(Math.random() * departments.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          estimatedDuration: Math.floor(Math.random() * 240) + 30,
          propertyId: 'property_1',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      // Apply filters
      let filteredTasks = mockTasks
      if (filters.assignedTo) {
        filteredTasks = filteredTasks.filter(t => t.assignedTo === filters.assignedTo)
      }
      if (filters.department) {
        filteredTasks = filteredTasks.filter(t => t.department === filters.department)
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filters.status)
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filters.priority)
      }
      
      const total = filteredTasks.length
      const skip = (page - 1) * limit
      const tasks = filteredTasks.slice(skip, skip + limit)
      
      const summary = {
        totalTasks: mockTasks.length,
        pendingTasks: mockTasks.filter(t => t.status === 'pending').length,
        completedTasks: mockTasks.filter(t => t.status === 'completed').length,
        byPriority: this.groupBy(mockTasks, 'priority'),
        byDepartment: this.groupBy(mockTasks, 'department')
      }
      
      return {
        success: true,
        data: {
          tasks,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          summary
        }
      }
      
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async updateTaskStatus(taskId: string, status: StaffTask['status'], userId: string): Promise<{
    success: boolean
    data?: StaffTask
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Updating task status:', taskId, status)
      
      await auditLogger.logUserAction({
        userId,
        action: 'update_task_status',
        resource: 'staff_task',
        resourceId: taskId,
        ip: 'internal',
        userAgent: 'system',
        details: { newStatus: status }
      })
      
      // Return mock updated task
      const updatedTask: StaffTask = {
        id: taskId,
        title: 'Updated Task',
        description: 'Task description',
        assignedTo: 'staff_1',
        assignedBy: 'manager_1',
        department: 'housekeeping',
        priority: 'medium',
        status,
        dueDate: new Date(),
        estimatedDuration: 120,
        propertyId: 'property_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : undefined
      }
      
      return { success: true, data: updatedTask }
      
    } catch (error) {
      console.error('Error updating task status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Performance Tracking
  
  static async getStaffPerformance(staffId: string, month: number, year: number): Promise<{
    success: boolean
    data?: StaffPerformance
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Generate mock performance data
      const performance: StaffPerformance = {
        staffId,
        month,
        year,
        hoursWorked: 160 + Math.floor(Math.random() * 20),
        hoursScheduled: 168,
        attendanceRate: 95 + Math.random() * 5,
        tasksCompleted: Math.floor(Math.random() * 50) + 20,
        tasksAssigned: Math.floor(Math.random() * 60) + 25,
        taskCompletionRate: 85 + Math.random() * 15,
        averageTaskRating: 4 + Math.random(),
        customerRatings: [4.5, 4.2, 4.8, 4.1, 4.6],
        punctualityScore: 90 + Math.random() * 10,
        notes: ['Excellent work ethic', 'Always punctual', 'Great team player'],
        propertyId: 'property_1'
      }
      
      return { success: true, data: performance }
      
    } catch (error) {
      console.error('Error fetching staff performance:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Workflow Management
  
  static async createWorkflow(workflowData: Omit<StaffWorkflow, 'id' | 'createdAt'>): Promise<{
    success: boolean
    data?: StaffWorkflow
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const newWorkflow: StaffWorkflow = {
        ...workflowData,
        id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date()
      }
      
      console.log('Creating workflow:', newWorkflow.name)
      
      return { success: true, data: newWorkflow }
      
    } catch (error) {
      console.error('Error creating workflow:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  static async executeWorkflow(workflowId: string, propertyId: string): Promise<{
    success: boolean
    data?: { tasks: StaffTask[] }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      console.log('Executing workflow:', workflowId)
      
      // Create tasks based on workflow steps
      const tasks: StaffTask[] = []
      
      // Mock workflow execution - create 3 tasks
      for (let i = 0; i < 3; i++) {
        tasks.push({
          id: `workflow_task_${i}`,
          title: `Workflow Task ${i + 1}`,
          description: `Generated from workflow ${workflowId}`,
          assignedTo: `staff_${i % 5}`,
          assignedBy: 'system',
          department: 'housekeeping',
          priority: 'medium',
          status: 'pending',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estimatedDuration: 60,
          propertyId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      return { success: true, data: { tasks } }
      
    } catch (error) {
      console.error('Error executing workflow:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  // Helper Methods
  
  private static async generateEmployeeId(propertyId: string): Promise<string> {
    // In production, query database for the next available ID
    const randomId = Math.floor(Math.random() * 9000) + 1000
    return `EMP${randomId}`
  }
  
  private static groupBy(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const value = item[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }
}

export default StaffService