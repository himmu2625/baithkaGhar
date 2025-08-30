import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import Room from '@/models/Room'
import RoomAvailability from '@/models/RoomAvailability'
import Booking from '@/models/Booking'
import RoomMaintenance from '@/models/RoomMaintenance'
import { ObjectId } from 'mongodb'

export interface RoomStatus {
  id: string
  roomNumber: string
  roomType: string
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order' | 'cleaning'
  housekeepingStatus: 'clean' | 'dirty' | 'inspecting' | 'cleaning' | 'out_of_order'
  currentBooking?: any
  nextBooking?: any
  maintenanceIssues: number
  lastCleaned?: Date
  notes?: string
}

export interface RoomFilters {
  status?: string[]
  roomTypes?: string[]
  floors?: number[]
  housekeepingStatus?: string[]
  hasMaintenanceIssues?: boolean
  availableDate?: Date
  page?: number
  limit?: number
}

export interface RoomInventoryStats {
  total: number
  available: number
  occupied: number
  maintenance: number
  outOfOrder: number
  cleaning: number
  occupancyRate: number
  maintenanceRate: number
  averageRate: number
  totalRevenue: number
  byRoomType: {
    [roomType: string]: {
      total: number
      available: number
      occupied: number
      rate: number
    }
  }
}

export class RoomService {
  static async getRoomsByProperty(propertyId: string, filters: RoomFilters = {}): Promise<{
    success: boolean
    data?: {
      rooms: RoomStatus[]
      pagination: any
      stats: RoomInventoryStats
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      const { 
        page = 1, 
        limit = 50, 
        status, 
        roomTypes, 
        floors, 
        housekeepingStatus,
        hasMaintenanceIssues,
        availableDate 
      } = filters
      
      // Build query
      let query: any = { propertyId: new ObjectId(propertyId) }
      
      if (status && status.length > 0) {
        query.status = { $in: status }
      }
      
      if (roomTypes && roomTypes.length > 0) {
        query.roomType = { $in: roomTypes }
      }
      
      if (floors && floors.length > 0) {
        query.floor = { $in: floors }
      }
      
      if (housekeepingStatus && housekeepingStatus.length > 0) {
        query.housekeepingStatus = { $in: housekeepingStatus }
      }

      const skip = (page - 1) * limit
      
      // Get rooms with current bookings and maintenance info
      const rooms = await Room.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'bookings',
            let: { roomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roomId', '$$roomId'] },
                      { $lte: ['$dateFrom', new Date()] },
                      { $gte: ['$dateTo', new Date()] },
                      { $eq: ['$status', 'confirmed'] }
                    ]
                  }
                }
              }
            ],
            as: 'currentBooking'
          }
        },
        {
          $lookup: {
            from: 'bookings',
            let: { roomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roomId', '$$roomId'] },
                      { $gt: ['$dateFrom', new Date()] },
                      { $eq: ['$status', 'confirmed'] }
                    ]
                  }
                }
              },
              { $sort: { dateFrom: 1 } },
              { $limit: 1 }
            ],
            as: 'nextBooking'
          }
        },
        {
          $lookup: {
            from: 'roommaintenances',
            let: { roomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roomId', '$$roomId'] },
                      { $ne: ['$status', 'completed'] }
                    ]
                  }
                }
              }
            ],
            as: 'maintenanceIssues'
          }
        },
        { $skip: skip },
        { $limit: limit }
      ])
      
      // Get total count for pagination
      const total = await Room.countDocuments(query)
      
      // Format room data
      const roomStatuses: RoomStatus[] = rooms.map(room => ({
        id: room._id.toString(),
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: this.determineRoomStatus(room),
        housekeepingStatus: room.housekeepingStatus || 'clean',
        currentBooking: room.currentBooking[0] ? {
          id: room.currentBooking[0]._id.toString(),
          guestName: room.currentBooking[0].guestName,
          checkIn: room.currentBooking[0].dateFrom,
          checkOut: room.currentBooking[0].dateTo
        } : null,
        nextBooking: room.nextBooking[0] ? {
          id: room.nextBooking[0]._id.toString(),
          guestName: room.nextBooking[0].guestName,
          checkIn: room.nextBooking[0].dateFrom,
          checkOut: room.nextBooking[0].dateTo
        } : null,
        maintenanceIssues: room.maintenanceIssues?.length || 0,
        lastCleaned: room.lastCleaned,
        notes: room.notes
      }))
      
      // Calculate inventory stats
      const stats = await this.calculateInventoryStats(propertyId)
      
      return {
        success: true,
        data: {
          rooms: roomStatuses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          },
          stats
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async updateRoomStatus(roomId: string, status: string, notes?: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      await connectToDatabase()
      
      const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning']
      if (!validStatuses.includes(status)) {
        return { success: false, message: 'Invalid room status' }
      }
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      if (status === 'cleaning') {
        updateData.housekeepingStatus = 'cleaning'
      } else if (status === 'available') {
        updateData.housekeepingStatus = 'clean'
        updateData.lastCleaned = new Date()
      }
      
      const room = await Room.findByIdAndUpdate(roomId, updateData, { new: true })
      
      if (!room) {
        return { success: false, message: 'Room not found' }
      }
      
      return {
        success: true,
        message: `Room ${room.roomNumber} status updated to ${status}`
      }
    } catch (error) {
      console.error('Error updating room status:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async updateHousekeepingStatus(roomId: string, housekeepingStatus: string, assignedTo?: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      await connectToDatabase()
      
      const validStatuses = ['clean', 'dirty', 'inspecting', 'cleaning', 'out_of_order']
      if (!validStatuses.includes(housekeepingStatus)) {
        return { success: false, message: 'Invalid housekeeping status' }
      }
      
      const updateData: any = {
        housekeepingStatus,
        updatedAt: new Date()
      }
      
      if (assignedTo) {
        updateData.assignedHousekeeper = assignedTo
      }
      
      if (housekeepingStatus === 'clean') {
        updateData.lastCleaned = new Date()
        updateData.status = 'available'
      } else if (housekeepingStatus === 'out_of_order') {
        updateData.status = 'out_of_order'
      }
      
      const room = await Room.findByIdAndUpdate(roomId, updateData, { new: true })
      
      if (!room) {
        return { success: false, message: 'Room not found' }
      }
      
      return {
        success: true,
        message: `Room ${room.roomNumber} housekeeping status updated to ${housekeepingStatus}`
      }
    } catch (error) {
      console.error('Error updating housekeeping status:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async createMaintenanceRequest(roomId: string, issue: {
    type: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    reportedBy: string
  }): Promise<{
    success: boolean
    maintenanceId?: string
    message: string
  }> {
    try {
      await connectToDatabase()
      
      const room = await Room.findById(roomId)
      if (!room) {
        return { success: false, message: 'Room not found' }
      }
      
      // Create maintenance record
      const maintenance = new RoomMaintenance({
        roomId: new ObjectId(roomId),
        propertyId: room.propertyId,
        issueType: issue.type,
        description: issue.description,
        priority: issue.priority,
        status: 'open',
        reportedBy: issue.reportedBy,
        reportedAt: new Date()
      })
      
      await maintenance.save()
      
      // Update room status if high priority
      if (issue.priority === 'urgent' || issue.priority === 'high') {
        await Room.findByIdAndUpdate(roomId, {
          status: 'maintenance',
          updatedAt: new Date()
        })
      }
      
      return {
        success: true,
        maintenanceId: maintenance._id.toString(),
        message: `Maintenance request created for room ${room.roomNumber}`
      }
    } catch (error) {
      console.error('Error creating maintenance request:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async getAvailability(propertyId: string, dateRange: { start: Date, end: Date }): Promise<{
    success: boolean
    data?: {
      [roomId: string]: {
        roomNumber: string
        roomType: string
        availability: Array<{
          date: string
          available: boolean
          rate?: number
          restrictions?: string[]
        }>
      }
    }
    error?: string
  }> {
    try {
      await connectToDatabase()
      
      // Get all rooms for property
      const rooms = await Room.find({ propertyId: new ObjectId(propertyId) })
        .select('roomNumber roomType baseRate')
        .lean()
      
      const availabilityData: any = {}
      
      for (const room of rooms) {
        const roomId = room._id.toString()
        
        // Get existing availability records
        const existingAvailability = await RoomAvailability.find({
          roomId: room._id,
          date: { $gte: dateRange.start, $lte: dateRange.end }
        }).lean()
        
        // Get bookings for this room in date range
        const bookings = await Booking.find({
          roomId: room._id,
          $or: [
            {
              dateFrom: { $lte: dateRange.end },
              dateTo: { $gte: dateRange.start }
            }
          ],
          status: { $in: ['confirmed', 'checked_in'] }
        }).lean()
        
        // Generate availability for each date
        const availability = []
        const currentDate = new Date(dateRange.start)
        
        while (currentDate <= dateRange.end) {
          const dateStr = currentDate.toISOString().split('T')[0]
          
          // Check if room is booked on this date
          const isBooked = bookings.some(booking => {
            const checkIn = new Date(booking.dateFrom)
            const checkOut = new Date(booking.dateTo)
            return currentDate >= checkIn && currentDate < checkOut
          })
          
          // Get existing availability record or use defaults
          const existingRecord = existingAvailability.find(a => 
            new Date(a.date).toISOString().split('T')[0] === dateStr
          )
          
          availability.push({
            date: dateStr,
            available: !isBooked && (existingRecord?.available ?? true),
            rate: existingRecord?.rate || room.baseRate || 0,
            restrictions: existingRecord?.restrictions || []
          })
          
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        availabilityData[roomId] = {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          availability
        }
      }
      
      return {
        success: true,
        data: availabilityData
      }
    } catch (error) {
      console.error('Error getting availability:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async updateAvailability(propertyId: string, updates: Array<{
    roomId: string
    date: Date
    available: boolean
    rate?: number
    restrictions?: string[]
  }>): Promise<{
    success: boolean
    message: string
    updatedCount: number
  }> {
    try {
      await connectToDatabase()
      
      let updatedCount = 0
      
      for (const update of updates) {
        await RoomAvailability.findOneAndUpdate(
          {
            roomId: new ObjectId(update.roomId),
            date: update.date
          },
          {
            available: update.available,
            ...(update.rate !== undefined && { rate: update.rate }),
            ...(update.restrictions && { restrictions: update.restrictions }),
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        )
        updatedCount++
      }
      
      return {
        success: true,
        message: `Updated availability for ${updatedCount} room-date combinations`,
        updatedCount
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        updatedCount: 0
      }
    }
  }

  private static determineRoomStatus(room: any): string {
    // If room has current booking, it's occupied
    if (room.currentBooking && room.currentBooking.length > 0) {
      return 'occupied'
    }
    
    // If room has maintenance issues, it's under maintenance
    if (room.maintenanceIssues && room.maintenanceIssues.length > 0) {
      const urgentIssues = room.maintenanceIssues.filter((m: any) => 
        m.priority === 'urgent' || m.priority === 'high'
      )
      if (urgentIssues.length > 0) {
        return 'maintenance'
      }
    }
    
    // If housekeeping status is not clean, room is cleaning
    if (room.housekeepingStatus && room.housekeepingStatus !== 'clean') {
      if (room.housekeepingStatus === 'out_of_order') {
        return 'out_of_order'
      }
      return 'cleaning'
    }
    
    // Otherwise, room is available
    return room.status || 'available'
  }

  private static async calculateInventoryStats(propertyId: string): Promise<RoomInventoryStats> {
    try {
      const rooms = await Room.aggregate([
        { $match: { propertyId: new ObjectId(propertyId) } },
        {
          $lookup: {
            from: 'bookings',
            let: { roomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roomId', '$$roomId'] },
                      { $lte: ['$dateFrom', new Date()] },
                      { $gte: ['$dateTo', new Date()] },
                      { $eq: ['$status', 'confirmed'] }
                    ]
                  }
                }
              }
            ],
            as: 'currentBooking'
          }
        },
        {
          $lookup: {
            from: 'roommaintenances',
            let: { roomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roomId', '$$roomId'] },
                      { $ne: ['$status', 'completed'] }
                    ]
                  }
                }
              }
            ],
            as: 'maintenanceIssues'
          }
        }
      ])

      const total = rooms.length
      let available = 0
      let occupied = 0
      let maintenance = 0
      let outOfOrder = 0
      let cleaning = 0
      let totalRevenue = 0
      const byRoomType: any = {}

      for (const room of rooms) {
        const status = this.determineRoomStatus(room)
        const roomType = room.roomType
        
        // Initialize room type stats
        if (!byRoomType[roomType]) {
          byRoomType[roomType] = {
            total: 0,
            available: 0,
            occupied: 0,
            rate: room.baseRate || 0
          }
        }
        
        byRoomType[roomType].total++
        
        switch (status) {
          case 'available':
            available++
            byRoomType[roomType].available++
            break
          case 'occupied':
            occupied++
            byRoomType[roomType].occupied++
            if (room.currentBooking[0]?.totalAmount) {
              totalRevenue += room.currentBooking[0].totalAmount
            }
            break
          case 'maintenance':
            maintenance++
            break
          case 'out_of_order':
            outOfOrder++
            break
          case 'cleaning':
            cleaning++
            break
        }
      }

      const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0
      const maintenanceRate = total > 0 ? Math.round((maintenance / total) * 100) : 0
      const averageRate = rooms.length > 0 ? 
        rooms.reduce((sum, room) => sum + (room.baseRate || 0), 0) / rooms.length : 0

      return {
        total,
        available,
        occupied,
        maintenance,
        outOfOrder,
        cleaning,
        occupancyRate,
        maintenanceRate,
        averageRate: Math.round(averageRate),
        totalRevenue: Math.round(totalRevenue),
        byRoomType
      }
    } catch (error) {
      console.error('Error calculating inventory stats:', error)
      return {
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
        outOfOrder: 0,
        cleaning: 0,
        occupancyRate: 0,
        maintenanceRate: 0,
        averageRate: 0,
        totalRevenue: 0,
        byRoomType: {}
      }
    }
  }
}

export default RoomService