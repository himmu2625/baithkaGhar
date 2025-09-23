import { connectToDatabase } from '@/lib/mongodb'

export interface MaintenanceTask {
  id: string
  propertyId: string
  roomId?: string
  roomNumber?: string
  facilityId?: string
  facilityName?: string

  // Task classification
  category: 'preventive' | 'corrective' | 'emergency' | 'upgrade' | 'inspection'
  type: 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 'appliances' | 'structural' | 'safety' | 'technology' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency'

  // Task details
  title: string
  description: string
  issueReported?: string
  estimatedDuration: number // hours
  estimatedCost?: number
  actualCost?: number

  // Scheduling
  scheduledDate?: Date
  scheduledTime?: string
  deadline?: Date
  recurringSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
    interval: number
    endDate?: Date
    nextOccurrence: Date
  }

  // Booking context
  affectedBookings: Array<{
    bookingId: string
    guestName: string
    checkIn: Date
    checkOut: Date
    impact: 'none' | 'minor' | 'major' | 'blocking'
    notified: boolean
  }>
  roomAvailabilityImpact: {
    blocksRoom: boolean
    estimatedDowntime: number // hours
    alternativeRequired: boolean
  }

  // Assignment and execution
  assignedTo?: {
    staffId: string
    staffName: string
    department: string
    contactInfo: string
  }
  externalVendor?: {
    companyName: string
    contactPerson: string
    phone: string
    email: string
    specialtyArea: string
  }

  // Status tracking
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'requires_parts'
  startedAt?: Date
  completedAt?: Date
  actualDuration?: number

  // Documentation
  beforePhotos?: string[]
  afterPhotos?: string[]
  workNotes?: string
  partsUsed?: Array<{
    partName: string
    quantity: number
    cost: number
    supplier?: string
  }>

  // Quality and approval
  qualityCheck?: {
    checkedBy: string
    checkedAt: Date
    approved: boolean
    issues?: string[]
    followUpRequired: boolean
  }

  // Metadata
  createdAt: Date
  createdBy: string
  lastUpdated: Date
  updatedBy: string

  // Guest communication
  guestNotification?: {
    sent: boolean
    sentAt?: Date
    method: 'email' | 'sms' | 'in_person' | 'phone'
    message?: string
  }
}

export interface MaintenanceSchedule {
  date: Date
  tasks: MaintenanceTask[]
  staffAssignments: Array<{
    staffId: string
    staffName: string
    tasks: string[]
    totalHours: number
  }>
  vendorSchedules: Array<{
    vendorName: string
    tasks: string[]
    timeSlots: Array<{
      startTime: string
      endTime: string
      taskId: string
    }>
  }>
  roomImpacts: Array<{
    roomNumber: string
    blockedPeriods: Array<{
      startTime: string
      endTime: string
      reason: string
    }>
    affectedBookings: string[]
  }>
}

export interface MaintenanceAnalytics {
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageCompletionTime: number
  totalCost: number
  costByCategory: { [category: string]: number }
  preventiveMaintenance: {
    tasksCompleted: number
    costSaved: number
    issuesPrevented: number
  }
  emergencyTasks: {
    count: number
    averageResponseTime: number
    cost: number
  }
  vendorPerformance: Array<{
    vendorName: string
    tasksCompleted: number
    averageCost: number
    qualityScore: number
  }>
  roomDowntime: Array<{
    roomNumber: string
    totalDowntimeHours: number
    revenueImpact: number
  }>
}

export class MaintenanceService {
  static async scheduleMaintenanceAroundBookings(task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'lastUpdated' | 'affectedBookings' | 'roomAvailabilityImpact'>): Promise<{ success: boolean; taskId?: string; conflicts?: any[]; error?: string }> {
    try {
      await connectToDatabase()

      const taskId = `MT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Find affected bookings if this is a room-specific task
      let affectedBookings: MaintenanceTask['affectedBookings'] = []
      let roomAvailabilityImpact: MaintenanceTask['roomAvailabilityImpact'] = {
        blocksRoom: false,
        estimatedDowntime: 0,
        alternativeRequired: false
      }

      if (task.roomId) {
        const bookingAnalysis = await this.analyzeBookingImpact(task.roomId, task.scheduledDate, task.estimatedDuration)
        affectedBookings = bookingAnalysis.affectedBookings
        roomAvailabilityImpact = bookingAnalysis.roomImpact

        // Check for scheduling conflicts
        if (bookingAnalysis.conflicts.length > 0) {
          return {
            success: false,
            conflicts: bookingAnalysis.conflicts,
            error: 'Scheduling conflicts detected with existing bookings'
          }
        }
      }

      const maintenanceTask: MaintenanceTask = {
        ...task,
        id: taskId,
        affectedBookings,
        roomAvailabilityImpact,
        createdAt: new Date(),
        lastUpdated: new Date(),
        createdBy: task.createdBy || 'system'
      }

      // Store the task
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')
      await collection.insertOne(maintenanceTask)

      await client.close()

      // Handle room blocking if necessary
      if (roomAvailabilityImpact.blocksRoom) {
        await this.blockRoomAvailability(task.roomId!, task.scheduledDate!, task.estimatedDuration)
      }

      // Notify affected guests
      if (affectedBookings.length > 0) {
        await this.notifyAffectedGuests(maintenanceTask)
      }

      // Create recurring tasks if specified
      if (task.recurringSchedule) {
        await this.createRecurringTasks(maintenanceTask)
      }

      // Auto-assign if internal task
      if (!task.externalVendor) {
        await this.autoAssignInternalTask(taskId)
      }

      return { success: true, taskId }

    } catch (error) {
      console.error('Error scheduling maintenance:', error)
      return { success: false, error: 'Failed to schedule maintenance task' }
    }
  }

  static async updateTaskStatus(taskId: string, status: MaintenanceTask['status'], updates?: {
    workNotes?: string
    actualDuration?: number
    actualCost?: number
    partsUsed?: MaintenanceTask['partsUsed']
    beforePhotos?: string[]
    afterPhotos?: string[]
    qualityCheck?: MaintenanceTask['qualityCheck']
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')

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

      const task = await collection.findOne({ id: taskId }) as MaintenanceTask

      // Unblock room if task is completed
      if (status === 'completed' && task?.roomId && task.roomAvailabilityImpact.blocksRoom) {
        await this.unblockRoomAvailability(task.roomId)
      }

      // Schedule quality check for critical tasks
      if (status === 'completed' && task?.priority === 'critical') {
        await this.scheduleQualityCheck(taskId)
      }

      await client.close()

      return { success: true }

    } catch (error) {
      console.error('Error updating maintenance task:', error)
      return { success: false, error: 'Failed to update maintenance task' }
    }
  }

  static async getMaintenanceSchedule(propertyId: string, date: Date): Promise<MaintenanceSchedule> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const tasks = await collection.find({
        propertyId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled', 'completed'] }
      }).toArray() as MaintenanceTask[]

      // Group by staff assignments
      const staffAssignments: { [staffId: string]: { staffName: string; tasks: string[]; totalHours: number } } = {}

      tasks.forEach(task => {
        if (task.assignedTo) {
          if (!staffAssignments[task.assignedTo.staffId]) {
            staffAssignments[task.assignedTo.staffId] = {
              staffName: task.assignedTo.staffName,
              tasks: [],
              totalHours: 0
            }
          }
          staffAssignments[task.assignedTo.staffId].tasks.push(task.id)
          staffAssignments[task.assignedTo.staffId].totalHours += task.estimatedDuration
        }
      })

      // Group by vendor schedules
      const vendorSchedules: { [vendorName: string]: { tasks: string[]; timeSlots: any[] } } = {}

      tasks.forEach(task => {
        if (task.externalVendor) {
          if (!vendorSchedules[task.externalVendor.companyName]) {
            vendorSchedules[task.externalVendor.companyName] = {
              tasks: [],
              timeSlots: []
            }
          }
          vendorSchedules[task.externalVendor.companyName].tasks.push(task.id)
          if (task.scheduledTime) {
            vendorSchedules[task.externalVendor.companyName].timeSlots.push({
              startTime: task.scheduledTime,
              endTime: this.calculateEndTime(task.scheduledTime, task.estimatedDuration),
              taskId: task.id
            })
          }
        }
      })

      // Calculate room impacts
      const roomImpacts: { [roomNumber: string]: { blockedPeriods: any[]; affectedBookings: string[] } } = {}

      tasks.forEach(task => {
        if (task.roomNumber && task.roomAvailabilityImpact.blocksRoom) {
          if (!roomImpacts[task.roomNumber]) {
            roomImpacts[task.roomNumber] = {
              blockedPeriods: [],
              affectedBookings: []
            }
          }

          if (task.scheduledTime) {
            roomImpacts[task.roomNumber].blockedPeriods.push({
              startTime: task.scheduledTime,
              endTime: this.calculateEndTime(task.scheduledTime, task.estimatedDuration),
              reason: task.title
            })
          }

          roomImpacts[task.roomNumber].affectedBookings.push(
            ...task.affectedBookings.map(b => b.bookingId)
          )
        }
      })

      await client.close()

      return {
        date,
        tasks,
        staffAssignments: Object.entries(staffAssignments).map(([staffId, data]) => ({
          staffId,
          ...data
        })),
        vendorSchedules: Object.entries(vendorSchedules).map(([vendorName, data]) => ({
          vendorName,
          ...data
        })),
        roomImpacts: Object.entries(roomImpacts).map(([roomNumber, data]) => ({
          roomNumber,
          ...data
        }))
      }

    } catch (error) {
      console.error('Error getting maintenance schedule:', error)
      throw error
    }
  }

  static async getTasksByProperty(propertyId: string, filters?: {
    status?: string
    category?: string
    priority?: string
    assignedTo?: string
    dateFrom?: Date
    dateTo?: Date
  }): Promise<MaintenanceTask[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')

      const query: any = { propertyId }

      if (filters) {
        if (filters.status) query.status = filters.status
        if (filters.category) query.category = filters.category
        if (filters.priority) query.priority = filters.priority
        if (filters.assignedTo) query['assignedTo.staffId'] = filters.assignedTo
        if (filters.dateFrom || filters.dateTo) {
          query.scheduledDate = {}
          if (filters.dateFrom) query.scheduledDate.$gte = filters.dateFrom
          if (filters.dateTo) query.scheduledDate.$lte = filters.dateTo
        }
      }

      const tasks = await collection.find(query).sort({ scheduledDate: 1 }).toArray()

      await client.close()

      return tasks as MaintenanceTask[]

    } catch (error) {
      console.error('Error fetching maintenance tasks:', error)
      return []
    }
  }

  static async getMaintenanceAnalytics(propertyId: string, period?: { from: Date; to: Date }): Promise<MaintenanceAnalytics> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')

      const query: any = { propertyId }
      if (period) {
        query.createdAt = {
          $gte: period.from,
          $lte: period.to
        }
      }

      const tasks = await collection.find(query).toArray() as MaintenanceTask[]

      const completedTasks = tasks.filter(t => t.status === 'completed')
      const totalTasks = tasks.length

      // Calculate costs by category
      const costByCategory: { [category: string]: number } = {}
      tasks.forEach(task => {
        if (task.actualCost || task.estimatedCost) {
          const cost = task.actualCost || task.estimatedCost || 0
          costByCategory[task.category] = (costByCategory[task.category] || 0) + cost
        }
      })

      // Calculate preventive maintenance metrics
      const preventiveTasks = tasks.filter(t => t.category === 'preventive')
      const emergencyTasks = tasks.filter(t => t.priority === 'emergency')

      const analytics: MaintenanceAnalytics = {
        totalTasks,
        completedTasks: completedTasks.length,
        completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
        averageCompletionTime: completedTasks.reduce((sum, t) => sum + (t.actualDuration || t.estimatedDuration), 0) / completedTasks.length || 0,
        totalCost: Object.values(costByCategory).reduce((sum, cost) => sum + cost, 0),
        costByCategory,
        preventiveMaintenance: {
          tasksCompleted: preventiveTasks.filter(t => t.status === 'completed').length,
          costSaved: preventiveTasks.length * 5000, // Estimated cost savings
          issuesPrevented: preventiveTasks.length * 2 // Estimated issues prevented
        },
        emergencyTasks: {
          count: emergencyTasks.length,
          averageResponseTime: emergencyTasks.reduce((sum, t) => {
            if (t.startedAt && t.createdAt) {
              return sum + (t.startedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)
            }
            return sum
          }, 0) / emergencyTasks.length || 0,
          cost: emergencyTasks.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost || 0), 0)
        },
        vendorPerformance: [],
        roomDowntime: []
      }

      await client.close()

      return analytics

    } catch (error) {
      console.error('Error calculating maintenance analytics:', error)
      throw error
    }
  }

  private static async analyzeBookingImpact(roomId: string, scheduledDate?: Date, estimatedDuration: number = 1) {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default

      if (!scheduledDate) {
        return {
          affectedBookings: [],
          roomImpact: {
            blocksRoom: false,
            estimatedDowntime: estimatedDuration,
            alternativeRequired: false
          },
          conflicts: []
        }
      }

      const maintenanceStart = new Date(scheduledDate)
      const maintenanceEnd = new Date(maintenanceStart.getTime() + estimatedDuration * 60 * 60 * 1000)

      // Find overlapping bookings
      const overlappingBookings = await Booking.find({
        roomId,
        status: { $in: ['confirmed', 'checked_in'] },
        $or: [
          { checkIn: { $lte: maintenanceEnd }, checkOut: { $gte: maintenanceStart } }
        ]
      })

      const conflicts = overlappingBookings.map(booking => ({
        bookingId: booking._id.toString(),
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        severity: 'high'
      }))

      const affectedBookings = overlappingBookings.map(booking => ({
        bookingId: booking._id.toString(),
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        impact: 'major' as const,
        notified: false
      }))

      return {
        affectedBookings,
        roomImpact: {
          blocksRoom: overlappingBookings.length === 0,
          estimatedDowntime: estimatedDuration,
          alternativeRequired: overlappingBookings.length > 0
        },
        conflicts
      }

    } catch (error) {
      console.error('Error analyzing booking impact:', error)
      return {
        affectedBookings: [],
        roomImpact: {
          blocksRoom: false,
          estimatedDowntime: estimatedDuration,
          alternativeRequired: false
        },
        conflicts: []
      }
    }
  }

  private static async blockRoomAvailability(roomId: string, startDate: Date, durationHours: number): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('room_blocks')

      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)

      await collection.insertOne({
        roomId,
        startDate,
        endDate,
        reason: 'maintenance',
        createdAt: new Date()
      })

      await client.close()

    } catch (error) {
      console.error('Error blocking room availability:', error)
    }
  }

  private static async unblockRoomAvailability(roomId: string): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('room_blocks')

      await collection.deleteMany({
        roomId,
        reason: 'maintenance',
        endDate: { $gte: new Date() }
      })

      await client.close()

    } catch (error) {
      console.error('Error unblocking room availability:', error)
    }
  }

  private static async notifyAffectedGuests(task: MaintenanceTask): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      for (const booking of task.affectedBookings) {
        const { connectToDatabase } = await import('@/lib/mongodb')
        const Booking = (await import('@/models/Booking')).default
        await connectToDatabase()

        const fullBooking = await Booking.findById(booking.bookingId).populate('userId')
        if (!fullBooking?.userId?.email) continue

        const subject = 'Important: Scheduled Maintenance Notice'
        const message = `
          Dear ${booking.guestName},

          We wanted to inform you about scheduled maintenance that may affect your upcoming stay.

          Maintenance Details:
          - Type: ${task.title}
          - Scheduled: ${task.scheduledDate?.toLocaleDateString()} at ${task.scheduledTime || 'TBD'}
          - Duration: Approximately ${task.estimatedDuration} hours
          - Room: ${task.roomNumber}

          We apologize for any inconvenience and are committed to minimizing disruption to your stay.
          ${task.roomAvailabilityImpact.alternativeRequired ? 'We may need to arrange alternative accommodations and will contact you personally to discuss options.' : ''}

          If you have any questions or concerns, please don't hesitate to contact us.

          Thank you for your understanding.

          Best regards,
          The Management Team
        `

        await EmailService.sendEmail({
          to: fullBooking.userId.email,
          subject,
          html: message.replace(/\n/g, '<br>'),
          text: message,
          priority: 'high'
        })

        // Mark as notified
        const { MongoClient } = await import('mongodb')
        const client = new MongoClient(process.env.MONGODB_URI!)
        await client.connect()

        const db = client.db()
        const collection = db.collection('maintenance_tasks')

        await collection.updateOne(
          { id: task.id, 'affectedBookings.bookingId': booking.bookingId },
          { $set: { 'affectedBookings.$.notified': true } }
        )

        await client.close()
      }

    } catch (error) {
      console.error('Error notifying affected guests:', error)
    }
  }

  private static async createRecurringTasks(baseTask: MaintenanceTask): Promise<void> {
    if (!baseTask.recurringSchedule) return

    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('maintenance_tasks')

      const { frequency, interval, endDate } = baseTask.recurringSchedule
      let nextDate = new Date(baseTask.recurringSchedule.nextOccurrence)

      const recurringTasks = []
      let count = 0
      const maxOccurrences = 50 // Safety limit

      while (count < maxOccurrences && (!endDate || nextDate <= endDate)) {
        const recurringTask: MaintenanceTask = {
          ...baseTask,
          id: `MT-${Date.now()}-${count}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          scheduledDate: new Date(nextDate),
          status: 'scheduled',
          affectedBookings: [], // Will be calculated when scheduled
          createdAt: new Date(),
          lastUpdated: new Date()
        }

        recurringTasks.push(recurringTask)

        // Calculate next occurrence
        switch (frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + interval)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + (interval * 7))
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval)
            break
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + (interval * 3))
            break
          case 'annually':
            nextDate.setFullYear(nextDate.getFullYear() + interval)
            break
        }

        count++
      }

      if (recurringTasks.length > 0) {
        await collection.insertMany(recurringTasks)
      }

      await client.close()

    } catch (error) {
      console.error('Error creating recurring tasks:', error)
    }
  }

  private static async autoAssignInternalTask(taskId: string): Promise<void> {
    // This would implement auto-assignment logic based on staff availability and expertise
    console.log(`Auto-assignment attempted for maintenance task ${taskId}`)
  }

  private static async scheduleQualityCheck(taskId: string): Promise<void> {
    // This would schedule a quality check for completed maintenance
    console.log(`Quality check scheduled for maintenance task ${taskId}`)
  }

  private static calculateEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }
}