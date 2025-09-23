import { connectToDatabase } from '@/lib/mongodb'

export interface HousekeepingTask {
  id: string
  propertyId: string
  roomId: string
  roomNumber: string
  taskType: 'checkout_cleaning' | 'maintenance_cleaning' | 'deep_cleaning' | 'inspection' | 'turnover' | 'special_request'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'quality_check'

  // Booking context
  bookingId?: string
  guestName?: string
  checkOutDate?: Date
  nextCheckInDate?: Date
  turnoverTime?: number // minutes between checkout and next checkin

  // Task details
  description: string
  estimatedDuration: number // minutes
  specialInstructions?: string
  equipmentNeeded?: string[]
  suppliesNeeded?: string[]

  // Assignment
  assignedTo?: string
  assignedStaff?: {
    id: string
    name: string
    department: string
    contactNumber: string
  }
  assignedAt?: Date

  // Execution
  startedAt?: Date
  completedAt?: Date
  actualDuration?: number
  photos?: string[]
  notes?: string

  // Quality control
  qualityCheck?: {
    checkedBy: string
    checkedAt: Date
    score: number // 1-10
    issues: string[]
    approved: boolean
    comments?: string
  }

  // Scheduling
  scheduledFor?: Date
  deadline?: Date
  isBlocking: boolean // blocks room availability

  // Metadata
  createdAt: Date
  createdBy: string
  lastUpdated: Date
  completionPhotos?: string[]
}

export interface HousekeepingSchedule {
  date: Date
  shifts: Array<{
    shiftId: string
    startTime: string
    endTime: string
    staff: Array<{
      id: string
      name: string
      role: string
      assignments: string[] // task IDs
    }>
  }>
  roomStatuses: Array<{
    roomId: string
    roomNumber: string
    status: 'clean' | 'dirty' | 'out_of_order' | 'maintenance' | 'occupied' | 'vacant_dirty' | 'vacant_clean'
    lastUpdated: Date
    nextGuest?: {
      guestName: string
      checkInTime: Date
    }
  }>
}

export interface HousekeepingAnalytics {
  completionRate: number
  averageCleaningTime: number
  qualityScore: number
  staffProductivity: Array<{
    staffId: string
    staffName: string
    tasksCompleted: number
    averageTime: number
    qualityScore: number
  }>
  roomTurnaround: Array<{
    roomNumber: string
    averageTurnaroundTime: number
    issues: number
  }>
  trends: Array<{
    date: string
    tasksCompleted: number
    averageTime: number
    qualityScore: number
  }>
}

export class HousekeepingService {
  static async createTaskFromBooking(bookingId: string, taskType: HousekeepingTask['taskType'] = 'checkout_cleaning'): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const Room = (await import('@/models/Room')).default

      const booking = await Booking.findById(bookingId).populate('roomId')
      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      const room = await Room.findById(booking.roomId)
      if (!room) {
        return { success: false, error: 'Room not found' }
      }

      // Find next booking for the same room
      const nextBooking = await Booking.findOne({
        roomId: booking.roomId,
        checkIn: { $gt: booking.checkOut },
        status: { $in: ['confirmed', 'checked_in'] }
      }).sort({ checkIn: 1 })

      const taskId = `HK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const turnoverTime = nextBooking
        ? Math.floor((nextBooking.checkIn.getTime() - booking.checkOut.getTime()) / (1000 * 60))
        : null

      // Determine priority based on turnover time
      let priority: HousekeepingTask['priority'] = 'medium'
      if (turnoverTime && turnoverTime < 180) priority = 'urgent' // < 3 hours
      else if (turnoverTime && turnoverTime < 360) priority = 'high' // < 6 hours

      const task: HousekeepingTask = {
        id: taskId,
        propertyId: booking.propertyId.toString(),
        roomId: booking.roomId.toString(),
        roomNumber: room.roomNumber,
        taskType,
        priority,
        status: 'pending',
        bookingId,
        guestName: booking.guestName,
        checkOutDate: booking.checkOut,
        nextCheckInDate: nextBooking?.checkIn,
        turnoverTime,
        description: this.generateTaskDescription(taskType, booking, nextBooking),
        estimatedDuration: this.getEstimatedDuration(taskType, room.roomType),
        isBlocking: true,
        deadline: nextBooking ? new Date(nextBooking.checkIn.getTime() - 30 * 60 * 1000) : undefined, // 30 min before next checkin
        createdAt: new Date(),
        createdBy: 'system',
        lastUpdated: new Date()
      }

      // Add special instructions based on room type and booking details
      task.specialInstructions = this.generateSpecialInstructions(booking, room, nextBooking)

      // Store the task
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('housekeeping_tasks')
      await collection.insertOne(task)

      await client.close()

      // Update room status
      await this.updateRoomStatus(room._id.toString(), 'dirty')

      // Auto-assign if available staff
      await this.autoAssignTask(taskId)

      // Notify housekeeping staff
      await this.notifyHousekeepingStaff(task)

      return { success: true, taskId }

    } catch (error) {
      console.error('Error creating housekeeping task:', error)
      return { success: false, error: 'Failed to create housekeeping task' }
    }
  }

  static async assignTask(taskId: string, staffId: string, assignedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const tasksCollection = db.collection('housekeeping_tasks')
      const staffCollection = db.collection('staff')

      const task = await tasksCollection.findOne({ id: taskId }) as HousekeepingTask
      if (!task) {
        await client.close()
        return { success: false, error: 'Task not found' }
      }

      const staff = await staffCollection.findOne({ id: staffId })
      if (!staff) {
        await client.close()
        return { success: false, error: 'Staff member not found' }
      }

      await tasksCollection.updateOne(
        { id: taskId },
        {
          $set: {
            assignedTo: staffId,
            assignedStaff: {
              id: staffId,
              name: staff.name,
              department: staff.department,
              contactNumber: staff.contactNumber
            },
            assignedAt: new Date(),
            status: 'assigned',
            lastUpdated: new Date()
          }
        }
      )

      await client.close()

      // Notify assigned staff
      await this.notifyStaffAssignment(task, staff)

      return { success: true }

    } catch (error) {
      console.error('Error assigning task:', error)
      return { success: false, error: 'Failed to assign task' }
    }
  }

  static async updateTaskStatus(taskId: string, status: HousekeepingTask['status'], updates?: {
    notes?: string
    photos?: string[]
    actualDuration?: number
    qualityCheck?: HousekeepingTask['qualityCheck']
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('housekeeping_tasks')

      const updateData: any = {
        status,
        lastUpdated: new Date()
      }

      if (status === 'in_progress') {
        updateData.startedAt = new Date()
      } else if (status === 'completed') {
        updateData.completedAt = new Date()
      }

      if (updates) {
        Object.assign(updateData, updates)
      }

      await collection.updateOne(
        { id: taskId },
        { $set: updateData }
      )

      const task = await collection.findOne({ id: taskId }) as HousekeepingTask

      // Update room status based on task completion
      if (status === 'completed' && task) {
        await this.updateRoomStatus(task.roomId, 'clean')

        // Trigger quality check if required
        if (task.taskType === 'checkout_cleaning' || task.taskType === 'deep_cleaning') {
          await this.scheduleQualityCheck(taskId)
        }
      }

      await client.close()

      return { success: true }

    } catch (error) {
      console.error('Error updating task status:', error)
      return { success: false, error: 'Failed to update task status' }
    }
  }

  static async getDailySchedule(propertyId: string, date: Date): Promise<HousekeepingSchedule> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const tasksCollection = db.collection('housekeeping_tasks')
      const roomsCollection = db.collection('rooms')

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Get tasks for the day
      const tasks = await tasksCollection.find({
        propertyId,
        $or: [
          { scheduledFor: { $gte: startOfDay, $lte: endOfDay } },
          { deadline: { $gte: startOfDay, $lte: endOfDay } },
          { status: { $in: ['pending', 'assigned', 'in_progress'] } }
        ]
      }).toArray() as HousekeepingTask[]

      // Get room statuses
      const rooms = await roomsCollection.find({ propertyId }).toArray()
      const roomStatuses = await Promise.all(rooms.map(async (room) => {
        const status = await this.getRoomStatus(room._id.toString())
        const nextBooking = await this.getNextBookingForRoom(room._id.toString())

        return {
          roomId: room._id.toString(),
          roomNumber: room.roomNumber,
          status,
          lastUpdated: new Date(),
          nextGuest: nextBooking ? {
            guestName: nextBooking.guestName,
            checkInTime: nextBooking.checkIn
          } : undefined
        }
      }))

      // Generate shifts (this would typically come from a staff scheduling system)
      const shifts = [
        {
          shiftId: 'morning',
          startTime: '08:00',
          endTime: '16:00',
          staff: await this.getShiftStaff('morning', propertyId, tasks)
        },
        {
          shiftId: 'evening',
          startTime: '16:00',
          endTime: '00:00',
          staff: await this.getShiftStaff('evening', propertyId, tasks)
        }
      ]

      await client.close()

      return {
        date,
        shifts,
        roomStatuses
      }

    } catch (error) {
      console.error('Error getting daily schedule:', error)
      throw error
    }
  }

  static async getTasksByProperty(propertyId: string, filters?: {
    status?: string
    assignedTo?: string
    dateFrom?: Date
    dateTo?: Date
    roomNumber?: string
  }): Promise<HousekeepingTask[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('housekeeping_tasks')

      const query: any = { propertyId }

      if (filters) {
        if (filters.status) query.status = filters.status
        if (filters.assignedTo) query.assignedTo = filters.assignedTo
        if (filters.roomNumber) query.roomNumber = filters.roomNumber
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {}
          if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom
          if (filters.dateTo) query.createdAt.$lte = filters.dateTo
        }
      }

      const tasks = await collection.find(query).sort({ createdAt: -1 }).toArray()

      await client.close()

      return tasks as HousekeepingTask[]

    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  }

  static async getHousekeepingAnalytics(propertyId: string, period?: { from: Date; to: Date }): Promise<HousekeepingAnalytics> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('housekeeping_tasks')

      const query: any = { propertyId }
      if (period) {
        query.createdAt = {
          $gte: period.from,
          $lte: period.to
        }
      }

      const tasks = await collection.find(query).toArray() as HousekeepingTask[]

      const completedTasks = tasks.filter(t => t.status === 'completed')
      const totalTasks = tasks.length

      const analytics: HousekeepingAnalytics = {
        completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
        averageCleaningTime: completedTasks.reduce((sum, t) => sum + (t.actualDuration || t.estimatedDuration), 0) / completedTasks.length || 0,
        qualityScore: completedTasks.reduce((sum, t) => sum + (t.qualityCheck?.score || 8), 0) / completedTasks.length || 0,
        staffProductivity: [],
        roomTurnaround: [],
        trends: []
      }

      // Calculate staff productivity
      const staffStats: { [key: string]: { name: string; tasks: number; totalTime: number; qualitySum: number; qualityCount: number } } = {}

      completedTasks.forEach(task => {
        if (task.assignedTo && task.assignedStaff) {
          if (!staffStats[task.assignedTo]) {
            staffStats[task.assignedTo] = {
              name: task.assignedStaff.name,
              tasks: 0,
              totalTime: 0,
              qualitySum: 0,
              qualityCount: 0
            }
          }

          staffStats[task.assignedTo].tasks++
          staffStats[task.assignedTo].totalTime += task.actualDuration || task.estimatedDuration

          if (task.qualityCheck) {
            staffStats[task.assignedTo].qualitySum += task.qualityCheck.score
            staffStats[task.assignedTo].qualityCount++
          }
        }
      })

      analytics.staffProductivity = Object.entries(staffStats).map(([staffId, stats]) => ({
        staffId,
        staffName: stats.name,
        tasksCompleted: stats.tasks,
        averageTime: stats.totalTime / stats.tasks,
        qualityScore: stats.qualityCount > 0 ? stats.qualitySum / stats.qualityCount : 0
      }))

      await client.close()

      return analytics

    } catch (error) {
      console.error('Error calculating housekeeping analytics:', error)
      throw error
    }
  }

  private static generateTaskDescription(taskType: HousekeepingTask['taskType'], booking: any, nextBooking?: any): string {
    const descriptions = {
      checkout_cleaning: `Post-checkout cleaning for ${booking.guestName}${nextBooking ? ` - Next guest arrives ${nextBooking.checkIn.toLocaleString()}` : ''}`,
      maintenance_cleaning: `Maintenance cleaning required`,
      deep_cleaning: `Deep cleaning scheduled`,
      inspection: `Room inspection required`,
      turnover: `Room turnover preparation${nextBooking ? ` for ${nextBooking.guestName}` : ''}`,
      special_request: `Special cleaning request`
    }
    return descriptions[taskType] || 'Cleaning task'
  }

  private static getEstimatedDuration(taskType: HousekeepingTask['taskType'], roomType: string): number {
    const baseTimes = {
      checkout_cleaning: 45,
      maintenance_cleaning: 30,
      deep_cleaning: 120,
      inspection: 15,
      turnover: 60,
      special_request: 30
    }

    const multipliers = {
      standard: 1.0,
      deluxe: 1.2,
      suite: 1.5,
      presidential: 2.0
    }

    const baseTime = baseTimes[taskType] || 45
    const multiplier = (multipliers as any)[roomType] || 1.0

    return Math.round(baseTime * multiplier)
  }

  private static generateSpecialInstructions(booking: any, room: any, nextBooking?: any): string {
    const instructions = []

    if (booking.specialRequests?.length) {
      instructions.push(`Previous guest requests: ${booking.specialRequests.join(', ')}`)
    }

    if (nextBooking) {
      const timeDiff = (nextBooking.checkIn.getTime() - booking.checkOut.getTime()) / (1000 * 60)
      if (timeDiff < 180) {
        instructions.push('URGENT: Quick turnaround required')
      }
    }

    if (room.roomType === 'suite' || room.roomType === 'presidential') {
      instructions.push('Premium room - extra attention to detail required')
    }

    return instructions.join('. ')
  }

  private static async autoAssignTask(taskId: string): Promise<void> {
    // This would implement auto-assignment logic based on staff availability and workload
    // For now, we'll just log the attempt
    console.log(`Auto-assignment attempted for task ${taskId}`)
  }

  private static async updateRoomStatus(roomId: string, status: string): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('room_statuses')

      await collection.updateOne(
        { roomId },
        {
          $set: {
            status,
            lastUpdated: new Date()
          }
        },
        { upsert: true }
      )

      await client.close()

    } catch (error) {
      console.error('Error updating room status:', error)
    }
  }

  private static async getRoomStatus(roomId: string): Promise<string> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('room_statuses')
      const statusDoc = await collection.findOne({ roomId })

      await client.close()

      return statusDoc?.status || 'clean'

    } catch (error) {
      console.error('Error getting room status:', error)
      return 'clean'
    }
  }

  private static async getNextBookingForRoom(roomId: string): Promise<any> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const nextBooking = await Booking.findOne({
        roomId,
        checkIn: { $gt: new Date() },
        status: { $in: ['confirmed', 'checked_in'] }
      }).sort({ checkIn: 1 })

      return nextBooking

    } catch (error) {
      console.error('Error getting next booking:', error)
      return null
    }
  }

  private static async getShiftStaff(shift: string, propertyId: string, tasks: HousekeepingTask[]): Promise<any[]> {
    // This would fetch staff from a staff scheduling system
    // For now, returning mock data
    return [
      {
        id: 'staff1',
        name: 'Maria Santos',
        role: 'Senior Housekeeper',
        assignments: tasks.filter(t => t.assignedTo === 'staff1').map(t => t.id)
      },
      {
        id: 'staff2',
        name: 'John Davis',
        role: 'Housekeeper',
        assignments: tasks.filter(t => t.assignedTo === 'staff2').map(t => t.id)
      }
    ]
  }

  private static async scheduleQualityCheck(taskId: string): Promise<void> {
    // This would schedule a quality check task
    console.log(`Quality check scheduled for task ${taskId}`)
  }

  private static async notifyHousekeepingStaff(task: HousekeepingTask): Promise<void> {
    try {
      // This would send notifications to housekeeping staff
      const EmailService = (await import('./email-service')).EmailService

      const subject = `New Housekeeping Task - ${task.taskType.replace('_', ' ').toUpperCase()}`
      const message = `
        New housekeeping task created:

        Task ID: ${task.id}
        Room: ${task.roomNumber}
        Type: ${task.taskType.replace('_', ' ')}
        Priority: ${task.priority.toUpperCase()}
        ${task.deadline ? `Deadline: ${task.deadline.toLocaleString()}` : ''}

        Description: ${task.description}

        Please assign and complete this task promptly.
      `

      // In a real implementation, this would get housekeeping manager emails from the database
      // For now, we'll log the notification
      console.log('Housekeeping notification:', message)

    } catch (error) {
      console.error('Error notifying housekeeping staff:', error)
    }
  }

  private static async notifyStaffAssignment(task: HousekeepingTask, staff: any): Promise<void> {
    try {
      const SMSService = (await import('./sms-service')).SMSService

      const message = `New task assigned: ${task.taskType.replace('_', ' ')} for room ${task.roomNumber}. Task ID: ${task.id}. ${task.deadline ? `Deadline: ${task.deadline.toLocaleTimeString()}` : ''}`

      if (staff.phone) {
        await SMSService.sendSMS({
          to: staff.phone,
          message,
          priority: task.priority === 'urgent' ? 'high' : 'normal',
          category: 'task_assignment'
        })
      }

    } catch (error) {
      console.error('Error notifying staff assignment:', error)
    }
  }
}