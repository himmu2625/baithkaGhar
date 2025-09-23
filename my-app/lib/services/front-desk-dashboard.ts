import { connectToDatabase } from '@/lib/mongodb'

export interface FrontDeskDashboard {
  propertyId: string
  date: Date
  summary: {
    totalRooms: number
    occupiedRooms: number
    availableRooms: number
    outOfOrderRooms: number
    occupancyRate: number
    expectedArrivals: number
    expectedDepartures: number
    walkIns: number
    noShows: number
  }
  arrivals: Array<{
    bookingId: string
    guestName: string
    roomNumber?: string
    roomType: string
    checkInTime: Date
    expectedArrival: string
    status: 'confirmed' | 'checked_in' | 'no_show' | 'cancelled'
    priority: 'normal' | 'vip' | 'corporate'
    specialRequests?: string[]
    phoneNumber?: string
    emailAddress?: string
    preCheckinCompleted: boolean
    roomReady: boolean
    estimatedArrival?: string
  }>
  departures: Array<{
    bookingId: string
    guestName: string
    roomNumber: string
    roomType: string
    checkOutTime: Date
    expectedDeparture: string
    status: 'occupied' | 'checked_out' | 'late_checkout'
    totalBill: number
    pendingCharges: number
    paymentStatus: 'paid' | 'pending' | 'failed'
    checkout: {
      requested: boolean
      requestedAt?: Date
      expressCheckout: boolean
      completed: boolean
      completedAt?: Date
    }
    housekeepingStatus: 'pending' | 'in_progress' | 'completed'
  }>
  roomStatus: Array<{
    roomId: string
    roomNumber: string
    roomType: string
    status: 'occupied' | 'vacant_clean' | 'vacant_dirty' | 'out_of_order' | 'maintenance'
    currentGuest?: {
      guestName: string
      checkIn: Date
      checkOut: Date
      bookingId: string
    }
    nextGuest?: {
      guestName: string
      checkIn: Date
      expectedArrival: string
      bookingId: string
    }
    housekeeping: {
      lastCleaned: Date
      assignedTo?: string
      estimatedCompletion?: Date
      priority: 'low' | 'medium' | 'high' | 'urgent'
    }
    maintenance?: {
      issueReported: boolean
      description?: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      assignedTo?: string
      estimatedCompletion?: Date
    }
  }>
  waitlist: Array<{
    guestName: string
    phoneNumber: string
    requestedDate: Date
    roomType: string
    numberOfGuests: number
    priority: number
    createdAt: Date
  }>
  alerts: Array<{
    id: string
    type: 'overbooking' | 'maintenance' | 'no_show' | 'late_checkout' | 'vip_arrival' | 'payment_issue' | 'system'
    priority: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    createdAt: Date
    acknowledged: boolean
    acknowledgedBy?: string
    resolvedAt?: Date
    relatedBookingId?: string
    relatedRoomId?: string
  }>
  quickActions: {
    availableRoomsForWalkIn: string[]
    roomsNeedingAttention: string[]
    overdueTasks: number
    pendingPayments: number
    unansweredCommunications: number
  }
  performance: {
    checkInTime: {
      average: number // minutes
      target: number
      efficiency: number // percentage
    }
    checkOutTime: {
      average: number
      target: number
      efficiency: number
    }
    roomTurnover: {
      average: number // minutes from checkout to ready
      target: number
      efficiency: number
    }
    guestSatisfaction: {
      currentRating: number
      target: number
      feedbackCount: number
    }
  }
}

export interface ShiftHandover {
  id: string
  propertyId: string
  date: Date
  fromShift: {
    type: 'morning' | 'afternoon' | 'evening' | 'night'
    startTime: string
    endTime: string
    staffMember: {
      id: string
      name: string
      role: string
    }
  }
  toShift: {
    type: 'morning' | 'afternoon' | 'evening' | 'night'
    startTime: string
    endTime: string
    staffMember: {
      id: string
      name: string
      role: string
    }
  }
  handoverItems: {
    guestSituations: Array<{
      guestName: string
      roomNumber: string
      situation: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      actionRequired: string
      status: 'pending' | 'in_progress' | 'resolved'
    }>
    operationalIssues: Array<{
      area: string
      issue: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      reportedAt: Date
      assignedTo?: string
      estimatedResolution?: Date
      status: 'reported' | 'assigned' | 'in_progress' | 'resolved'
    }>
    maintenanceAlerts: Array<{
      roomNumber?: string
      facility?: string
      issue: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      reportedAt: Date
      workOrderNumber?: string
      status: 'reported' | 'scheduled' | 'in_progress' | 'completed'
    }>
    specialInstructions: Array<{
      category: 'guest_service' | 'operations' | 'security' | 'management'
      instruction: string
      validUntil?: Date
      importance: 'info' | 'important' | 'critical'
    }>
    pendingTasks: Array<{
      taskId: string
      description: string
      assignedTo: string
      deadline: Date
      priority: 'low' | 'medium' | 'high' | 'urgent'
      status: 'pending' | 'in_progress' | 'overdue'
    }>
  }
  keyMetrics: {
    occupancyRate: number
    revenue: number
    averageRate: number
    arrivals: number
    departures: number
    walkIns: number
    cancellations: number
    complaints: number
    compliments: number
  }
  cashHandover?: {
    openingBalance: number
    totalReceipts: number
    totalPayouts: number
    closingBalance: number
    cashInHand: number
    variance: number
    verified: boolean
    verifiedBy?: string
  }
  systemStatus: {
    pmsStatus: 'online' | 'offline' | 'limited'
    paymentGateway: 'online' | 'offline' | 'maintenance'
    internetConnection: 'stable' | 'unstable' | 'down'
    phoneSystem: 'operational' | 'issues' | 'down'
    lastBackup: Date
    pendingUpdates: number
  }
  notes: string
  acknowledgment: {
    acknowledged: boolean
    acknowledgedAt?: Date
    acknowledgedBy?: string
    signature?: string
  }
  createdAt: Date
  completedAt?: Date
}

export class FrontDeskDashboardService {
  static async getDashboard(propertyId: string, date: Date = new Date()): Promise<FrontDeskDashboard> {
    try {
      await connectToDatabase()

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Get all necessary data in parallel
      const [
        summary,
        arrivals,
        departures,
        roomStatus,
        waitlist,
        alerts,
        quickActions,
        performance
      ] = await Promise.all([
        this.calculateSummary(propertyId, date),
        this.getArrivals(propertyId, date),
        this.getDepartures(propertyId, date),
        this.getRoomStatus(propertyId),
        this.getWaitlist(propertyId, date),
        this.getAlerts(propertyId),
        this.getQuickActions(propertyId, date),
        this.getPerformanceMetrics(propertyId, date)
      ])

      return {
        propertyId,
        date,
        summary,
        arrivals,
        departures,
        roomStatus,
        waitlist,
        alerts,
        quickActions,
        performance
      }

    } catch (error) {
      console.error('Error generating front desk dashboard:', error)
      throw error
    }
  }

  static async createShiftHandover(handoverData: Omit<ShiftHandover, 'id' | 'createdAt'>): Promise<{ success: boolean; handoverId?: string; error?: string }> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const handoverId = `SH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const shiftHandover: ShiftHandover = {
        ...handoverData,
        id: handoverId,
        createdAt: new Date()
      }

      const db = client.db()
      const collection = db.collection('shift_handovers')
      await collection.insertOne(shiftHandover)

      await client.close()

      // Notify incoming shift staff
      await this.notifyIncomingShift(shiftHandover)

      return { success: true, handoverId }

    } catch (error) {
      console.error('Error creating shift handover:', error)
      return { success: false, error: 'Failed to create shift handover' }
    }
  }

  static async acknowledgeHandover(handoverId: string, acknowledgedBy: string, signature?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('shift_handovers')

      await collection.updateOne(
        { id: handoverId },
        {
          $set: {
            'acknowledgment.acknowledged': true,
            'acknowledgment.acknowledgedAt': new Date(),
            'acknowledgment.acknowledgedBy': acknowledgedBy,
            'acknowledgment.signature': signature,
            completedAt: new Date()
          }
        }
      )

      await client.close()

      return { success: true }

    } catch (error) {
      console.error('Error acknowledging handover:', error)
      return { success: false, error: 'Failed to acknowledge handover' }
    }
  }

  static async getShiftHandovers(propertyId: string, filters?: {
    date?: Date
    shiftType?: string
    staffMember?: string
  }): Promise<ShiftHandover[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('shift_handovers')

      const query: any = { propertyId }

      if (filters) {
        if (filters.date) {
          const startOfDay = new Date(filters.date)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(filters.date)
          endOfDay.setHours(23, 59, 59, 999)

          query.date = { $gte: startOfDay, $lte: endOfDay }
        }
        if (filters.shiftType) {
          query.$or = [
            { 'fromShift.type': filters.shiftType },
            { 'toShift.type': filters.shiftType }
          ]
        }
        if (filters.staffMember) {
          query.$or = [
            { 'fromShift.staffMember.id': filters.staffMember },
            { 'toShift.staffMember.id': filters.staffMember }
          ]
        }
      }

      const handovers = await collection.find(query).sort({ createdAt: -1 }).toArray()

      await client.close()

      return handovers as ShiftHandover[]

    } catch (error) {
      console.error('Error fetching shift handovers:', error)
      return []
    }
  }

  private static async calculateSummary(propertyId: string, date: Date): Promise<FrontDeskDashboard['summary']> {
    const Room = (await import('@/models/Room')).default
    const Booking = (await import('@/models/Booking')).default

    const rooms = await Room.find({ propertyId })
    const totalRooms = rooms.length

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get current occupancy
    const currentBookings = await Booking.find({
      propertyId,
      checkIn: { $lte: endOfDay },
      checkOut: { $gt: startOfDay },
      status: { $in: ['confirmed', 'checked_in'] }
    })

    const occupiedRooms = currentBookings.length

    // Get arrivals for today
    const arrivals = await Booking.find({
      propertyId,
      checkIn: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'checked_in'] }
    })

    // Get departures for today
    const departures = await Booking.find({
      propertyId,
      checkOut: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['checked_in', 'checked_out'] }
    })

    // Calculate metrics
    const outOfOrderRooms = 0 // Would be calculated from room status
    const availableRooms = totalRooms - occupiedRooms - outOfOrderRooms
    const occupancyRate = (occupiedRooms / totalRooms) * 100

    const walkIns = arrivals.filter(booking => booking.bookingChannel === 'walk_in').length
    const noShows = arrivals.filter(booking => booking.status === 'no_show').length

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      outOfOrderRooms,
      occupancyRate,
      expectedArrivals: arrivals.length,
      expectedDepartures: departures.length,
      walkIns,
      noShows
    }
  }

  private static async getArrivals(propertyId: string, date: Date): Promise<FrontDeskDashboard['arrivals']> {
    const Booking = (await import('@/models/Booking')).default

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const bookings = await Booking.find({
      propertyId,
      checkIn: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'checked_in', 'no_show'] }
    }).populate('roomId').populate('userId')

    return bookings.map(booking => ({
      bookingId: booking._id.toString(),
      guestName: booking.guestName,
      roomNumber: booking.roomId?.roomNumber,
      roomType: booking.roomId?.roomType || 'Standard',
      checkInTime: booking.checkIn,
      expectedArrival: booking.expectedArrival || '15:00',
      status: booking.status === 'checked_in' ? 'checked_in' :
              booking.status === 'no_show' ? 'no_show' : 'confirmed',
      priority: booking.guestType === 'vip' ? 'vip' :
               booking.guestType === 'corporate' ? 'corporate' : 'normal',
      specialRequests: booking.specialRequests,
      phoneNumber: booking.userId?.phone,
      emailAddress: booking.userId?.email,
      preCheckinCompleted: booking.preCheckinCompleted || false,
      roomReady: true, // Would be checked from housekeeping status
      estimatedArrival: booking.estimatedArrival
    }))
  }

  private static async getDepartures(propertyId: string, date: Date): Promise<FrontDeskDashboard['departures']> {
    const Booking = (await import('@/models/Booking')).default

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const bookings = await Booking.find({
      propertyId,
      checkOut: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['checked_in', 'checked_out'] }
    }).populate('roomId')

    return bookings.map(booking => ({
      bookingId: booking._id.toString(),
      guestName: booking.guestName,
      roomNumber: booking.roomId?.roomNumber || 'TBD',
      roomType: booking.roomId?.roomType || 'Standard',
      checkOutTime: booking.checkOut,
      expectedDeparture: booking.expectedDeparture || '11:00',
      status: booking.status === 'checked_out' ? 'checked_out' :
              booking.checkOut < new Date() ? 'late_checkout' : 'occupied',
      totalBill: booking.totalAmount,
      pendingCharges: booking.pendingCharges || 0,
      paymentStatus: booking.paymentStatus || 'pending',
      checkout: {
        requested: booking.checkoutRequested || false,
        requestedAt: booking.checkoutRequestedAt,
        expressCheckout: booking.expressCheckout || false,
        completed: booking.status === 'checked_out',
        completedAt: booking.checkedOutAt
      },
      housekeepingStatus: 'pending' // Would be fetched from housekeeping service
    }))
  }

  private static async getRoomStatus(propertyId: string): Promise<FrontDeskDashboard['roomStatus']> {
    const Room = (await import('@/models/Room')).default
    const Booking = (await import('@/models/Booking')).default

    const rooms = await Room.find({ propertyId })

    const roomStatuses = await Promise.all(rooms.map(async (room) => {
      // Get current booking
      const currentBooking = await Booking.findOne({
        roomId: room._id,
        checkIn: { $lte: new Date() },
        checkOut: { $gt: new Date() },
        status: { $in: ['confirmed', 'checked_in'] }
      })

      // Get next booking
      const nextBooking = await Booking.findOne({
        roomId: room._id,
        checkIn: { $gt: new Date() },
        status: { $in: ['confirmed', 'checked_in'] }
      }).sort({ checkIn: 1 })

      let status: 'occupied' | 'vacant_clean' | 'vacant_dirty' | 'out_of_order' | 'maintenance' = 'vacant_clean'

      if (currentBooking) {
        status = 'occupied'
      } else {
        // Would check housekeeping status to determine if clean or dirty
        status = 'vacant_clean'
      }

      return {
        roomId: room._id.toString(),
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status,
        currentGuest: currentBooking ? {
          guestName: currentBooking.guestName,
          checkIn: currentBooking.checkIn,
          checkOut: currentBooking.checkOut,
          bookingId: currentBooking._id.toString()
        } : undefined,
        nextGuest: nextBooking ? {
          guestName: nextBooking.guestName,
          checkIn: nextBooking.checkIn,
          expectedArrival: nextBooking.expectedArrival || '15:00',
          bookingId: nextBooking._id.toString()
        } : undefined,
        housekeeping: {
          lastCleaned: new Date(), // Would be from housekeeping records
          priority: 'medium' as const
        }
      }
    }))

    return roomStatuses
  }

  private static async getWaitlist(propertyId: string, date: Date): Promise<FrontDeskDashboard['waitlist']> {
    // This would fetch from a waitlist collection
    // For now, returning empty array
    return []
  }

  private static async getAlerts(propertyId: string): Promise<FrontDeskDashboard['alerts']> {
    // This would generate alerts based on various system conditions
    // For now, returning mock alerts
    return [
      {
        id: 'alert-1',
        type: 'vip_arrival',
        priority: 'high',
        title: 'VIP Guest Arriving Soon',
        description: 'Mr. John Smith (VIP) expected to arrive at 3:00 PM in Presidential Suite',
        createdAt: new Date(),
        acknowledged: false
      },
      {
        id: 'alert-2',
        type: 'maintenance',
        priority: 'medium',
        title: 'Room 205 AC Issue',
        description: 'Air conditioning not working properly, maintenance required',
        createdAt: new Date(),
        acknowledged: false,
        relatedRoomId: 'room-205'
      }
    ]
  }

  private static async getQuickActions(propertyId: string, date: Date): Promise<FrontDeskDashboard['quickActions']> {
    // This would calculate available rooms and pending items
    return {
      availableRoomsForWalkIn: ['101', '102', '203', '301'],
      roomsNeedingAttention: ['205', '310'],
      overdueTasks: 3,
      pendingPayments: 2,
      unansweredCommunications: 1
    }
  }

  private static async getPerformanceMetrics(propertyId: string, date: Date): Promise<FrontDeskDashboard['performance']> {
    // This would calculate actual performance metrics
    return {
      checkInTime: {
        average: 8.5,
        target: 10,
        efficiency: 85
      },
      checkOutTime: {
        average: 5.2,
        target: 5,
        efficiency: 96
      },
      roomTurnover: {
        average: 45,
        target: 60,
        efficiency: 75
      },
      guestSatisfaction: {
        currentRating: 4.3,
        target: 4.5,
        feedbackCount: 25
      }
    }
  }

  private static async notifyIncomingShift(handover: ShiftHandover): Promise<void> {
    try {
      const SMSService = (await import('./sms-service')).SMSService

      const message = `Shift handover ready for ${handover.toShift.type} shift. Please review and acknowledge. Handover ID: ${handover.id}`

      // In a real implementation, this would get the staff member's phone number
      console.log('Shift handover notification:', message)

    } catch (error) {
      console.error('Error notifying incoming shift:', error)
    }
  }
}