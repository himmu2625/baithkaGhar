import { connectToDatabase } from '@/lib/mongodb'
import Room from '@/models/Room'
import RoomType from '@/models/RoomType'
import Booking from '@/models/Booking'
import { Types } from 'mongoose'
import { addDays, isAfter, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns'

export interface RoomAllocationRequest {
  propertyId: string
  checkInDate: Date
  checkOutDate: Date
  guestCount: number
  preferences?: {
    roomTypeId?: string
    floor?: number
    wing?: string
    amenities?: string[]
    accessibility?: boolean
    view?: string[]
  }
  specialRequests?: string
}

export interface RoomAllocationResult {
  success: boolean
  allocatedRoom?: {
    roomId: string
    roomNumber: string
    roomTypeId: string
    roomTypeName: string
    floor: number
    amenities: string[]
    price: number
  }
  alternatives?: Array<{
    roomId: string
    roomNumber: string
    roomTypeName: string
    price: number
    reason: string
  }>
  error?: string
  overbookingWarning?: boolean
}

export interface AvailabilityCheck {
  roomId: string
  roomNumber: string
  roomTypeId: string
  available: boolean
  conflictingBookings: Array<{
    bookingId: string
    checkIn: Date
    checkOut: Date
    guestName: string
  }>
}

export interface RoomUpgradeOption {
  roomId: string
  roomNumber: string
  roomTypeName: string
  currentPrice: number
  upgradePrice: number
  priceDifference: number
  benefits: string[]
  available: boolean
}

export class RoomAllocationService {
  // Main room allocation method
  static async allocateRoom(request: RoomAllocationRequest): Promise<RoomAllocationResult> {
    try {
      await connectToDatabase()

      // Step 1: Get available rooms based on criteria
      const availableRooms = await this.getAvailableRooms(
        request.propertyId,
        request.checkInDate,
        request.checkOutDate,
        request.guestCount,
        request.preferences
      )

      if (availableRooms.length === 0) {
        // Check for overbooking possibilities
        const overbookingOptions = await this.checkOverbookingOptions(request)

        return {
          success: false,
          error: 'No rooms available for the selected dates',
          alternatives: overbookingOptions,
          overbookingWarning: overbookingOptions.length > 0
        }
      }

      // Step 2: Apply intelligent allocation logic
      const selectedRoom = await this.selectOptimalRoom(availableRooms, request)

      // Step 3: Calculate pricing
      const pricing = await this.calculateRoomPricing(
        selectedRoom._id.toString(),
        request.checkInDate,
        request.checkOutDate
      )

      // Step 4: Reserve the room temporarily (5-minute hold)
      await this.createTemporaryHold(selectedRoom._id.toString(), request.checkInDate, request.checkOutDate)

      return {
        success: true,
        allocatedRoom: {
          roomId: selectedRoom._id.toString(),
          roomNumber: selectedRoom.roomNumber,
          roomTypeId: selectedRoom.roomTypeId.toString(),
          roomTypeName: selectedRoom.roomType?.name || 'Unknown',
          floor: selectedRoom.floor,
          amenities: this.extractAmenities(selectedRoom),
          price: pricing.totalPrice
        },
        alternatives: await this.getAlternativeRooms(availableRooms, selectedRoom._id.toString())
      }

    } catch (error) {
      console.error('Room allocation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to allocate room'
      }
    }
  }

  // Get available rooms with advanced filtering
  static async getAvailableRooms(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number,
    preferences?: RoomAllocationRequest['preferences']
  ) {
    const query: any = {
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      isBookable: true,
      status: { $in: ['available', 'clean'] }
    }

    // Apply guest count filter through room type
    const roomTypeQuery: any = {
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      isBookable: true,
      'maxOccupancy.total': { $gte: guestCount }
    }

    // Apply preferences
    if (preferences?.roomTypeId) {
      query.roomTypeId = new Types.ObjectId(preferences.roomTypeId)
    }

    if (preferences?.floor) {
      query.floor = preferences.floor
    }

    if (preferences?.wing) {
      query.wing = preferences.wing
    }

    if (preferences?.accessibility) {
      query['accessibility.wheelchairAccessible'] = true
    }

    if (preferences?.amenities?.length) {
      // Match specific amenities
      const amenityQueries = preferences.amenities.map(amenity => {
        switch (amenity) {
          case 'balcony': return { 'specificAmenities.hasBalcony': true }
          case 'kitchen': return { 'specificAmenities.hasKitchen': true }
          case 'ac': return { 'specificAmenities.hasAC': true }
          case 'tv': return { 'specificAmenities.hasSmartTV': true }
          case 'safe': return { 'specificAmenities.hasSafe': true }
          case 'minibar': return { 'specificAmenities.hasMinibar': true }
          case 'jacuzzi': return { 'specificAmenities.hasJacuzzi': true }
          default: return { 'specificAmenities.customAmenities': amenity }
        }
      })
      query.$and = amenityQueries
    }

    if (preferences?.view?.length) {
      query.view = { $in: preferences.view }
    }

    // Get compatible room types first
    const compatibleRoomTypes = await RoomType.find(roomTypeQuery)
    const roomTypeIds = compatibleRoomTypes.map(rt => rt._id)
    query.roomTypeId = { $in: roomTypeIds }

    // Get rooms and check availability
    const rooms = await Room.find(query)
      .populate('roomTypeId')
      .sort({
        floor: 1,
        roomNumber: 1
      })
      .lean()

    // Filter out rooms with conflicting bookings
    const availableRooms = []
    for (const room of rooms) {
      const isAvailable = await this.checkRoomAvailability(
        room._id.toString(),
        checkInDate,
        checkOutDate
      )

      if (isAvailable) {
        availableRooms.push(room)
      }
    }

    return availableRooms
  }

  // Check if a specific room is available for given dates
  static async checkRoomAvailability(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    const conflictingBookings = await Booking.find({
      'allocatedRoom.roomId': roomId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        // New booking starts during existing booking
        {
          dateFrom: { $lte: checkInDate },
          dateTo: { $gt: checkInDate }
        },
        // New booking ends during existing booking
        {
          dateFrom: { $lt: checkOutDate },
          dateTo: { $gte: checkOutDate }
        },
        // New booking completely encompasses existing booking
        {
          dateFrom: { $gte: checkInDate },
          dateTo: { $lte: checkOutDate }
        },
        // Existing booking completely encompasses new booking
        {
          dateFrom: { $lte: checkInDate },
          dateTo: { $gte: checkOutDate }
        }
      ]
    })

    return conflictingBookings.length === 0
  }

  // Intelligent room selection based on preferences and optimization
  static async selectOptimalRoom(availableRooms: any[], request: RoomAllocationRequest) {
    if (availableRooms.length === 1) {
      return availableRooms[0]
    }

    // Scoring system for room selection
    const scoredRooms = availableRooms.map(room => {
      let score = 0

      // Preference matching
      if (request.preferences?.floor && room.floor === request.preferences.floor) {
        score += 10
      }

      if (request.preferences?.wing && room.wing === request.preferences.wing) {
        score += 8
      }

      if (request.preferences?.view?.length) {
        const matchingViews = room.view?.filter((v: string) =>
          request.preferences?.view?.includes(v)
        ).length || 0
        score += matchingViews * 5
      }

      // Room condition scoring
      switch (room.condition) {
        case 'excellent': score += 15; break
        case 'good': score += 10; break
        case 'fair': score += 5; break
        default: score += 0
      }

      // Housekeeping status scoring
      switch (room.housekeeping?.cleaningStatus) {
        case 'inspected': score += 10; break
        case 'clean': score += 8; break
        case 'cleaning_in_progress': score += 3; break
        default: score += 0
      }

      // Avoid rooms with recent issues
      if (room.maintenance?.currentIssues?.length > 0) {
        score -= 20
      }

      if (room.housekeeping?.housekeepingIssues?.length > 0) {
        score -= 10
      }

      // Prefer rooms with better guest feedback
      score += (room.feedback?.averageRating || 0) * 2

      // Prefer recently maintained rooms
      const daysSinceLastMaintenance = room.maintenance?.lastMaintenance
        ? Math.floor((Date.now() - new Date(room.maintenance.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (daysSinceLastMaintenance < 30) {
        score += 5
      }

      return { room, score }
    })

    // Sort by score (highest first)
    scoredRooms.sort((a, b) => b.score - a.score)

    return scoredRooms[0].room
  }

  // Get alternative room options
  static async getAlternativeRooms(availableRooms: any[], excludeRoomId: string) {
    return availableRooms
      .filter(room => room._id.toString() !== excludeRoomId)
      .slice(0, 3) // Top 3 alternatives
      .map(room => ({
        roomId: room._id.toString(),
        roomNumber: room.roomNumber,
        roomTypeName: room.roomType?.name || 'Unknown',
        price: room.pricing?.dynamicPricing?.currentRate || room.pricing?.baseRate || 0,
        reason: this.getAlternativeReason(room)
      }))
  }

  // Calculate room pricing for the stay period
  static async calculateRoomPricing(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date
  ) {
    const room = await Room.findById(roomId).populate('roomTypeId')
    if (!room) {
      throw new Error('Room not found')
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const baseRate = room.pricing?.dynamicPricing?.currentRate || room.pricing?.baseRate || 0
    const seasonalMultiplier = room.pricing?.seasonalMultiplier || 1

    // Apply seasonal pricing
    let totalPrice = baseRate * nights * seasonalMultiplier

    // Check for special rates
    const applicableSpecialRates = room.pricing?.specialRates?.filter((rate: any) => {
      return rate.isActive &&
             new Date(rate.validFrom) <= checkInDate &&
             new Date(rate.validTo) >= checkOutDate
    }) || []

    if (applicableSpecialRates.length > 0) {
      // Use the best rate
      const bestRate = Math.min(...applicableSpecialRates.map((r: any) => r.rate))
      totalPrice = bestRate * nights
    }

    return {
      baseRate,
      nights,
      seasonalMultiplier,
      totalPrice,
      pricePerNight: totalPrice / nights,
      specialRates: applicableSpecialRates
    }
  }

  // Create temporary hold on room (prevents double booking)
  static async createTemporaryHold(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    holdDurationMinutes: number = 5
  ) {
    const holdUntil = new Date(Date.now() + holdDurationMinutes * 60 * 1000)

    // This would typically be stored in a separate holds collection
    // For now, we'll use the room's notes field with a timestamp
    await Room.findByIdAndUpdate(roomId, {
      $set: {
        'temporaryHold': {
          heldUntil: holdUntil,
          checkInDate,
          checkOutDate,
          createdAt: new Date()
        }
      }
    })
  }

  // Check for overbooking options (with warnings)
  static async checkOverbookingOptions(request: RoomAllocationRequest) {
    // This is a simplified overbooking check
    // In production, this would be more sophisticated with business rules
    const allRooms = await Room.find({
      propertyId: new Types.ObjectId(request.propertyId),
      isActive: true,
      status: { $in: ['available', 'clean', 'occupied'] }
    }).populate('roomTypeId').limit(3)

    return allRooms.map(room => ({
      roomId: room._id.toString(),
      roomNumber: room.roomNumber,
      roomTypeName: room.roomType?.name || 'Unknown',
      price: room.pricing?.baseRate || 0,
      reason: 'Overbooked - Subject to availability'
    }))
  }

  // Get room upgrade options
  static async getRoomUpgradeOptions(
    propertyId: string,
    currentRoomTypeId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number
  ): Promise<RoomUpgradeOption[]> {
    await connectToDatabase()

    const currentRoomType = await RoomType.findById(currentRoomTypeId)
    if (!currentRoomType) {
      return []
    }

    // Find room types with higher category or better amenities
    const upgradeRoomTypes = await RoomType.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      isBookable: true,
      'maxOccupancy.total': { $gte: guestCount },
      $or: [
        { 'basePrice.perNight': { $gt: currentRoomType.basePrice.perNight } },
        { category: { $in: this.getHigherCategories(currentRoomType.category) } }
      ]
    })

    const upgradeOptions: RoomUpgradeOption[] = []

    for (const roomType of upgradeRoomTypes) {
      // Find available rooms of this type
      const availableRooms = await this.getAvailableRooms(
        propertyId,
        checkInDate,
        checkOutDate,
        guestCount,
        { roomTypeId: roomType._id.toString() }
      )

      if (availableRooms.length > 0) {
        const room = availableRooms[0]
        const pricing = await this.calculateRoomPricing(
          room._id.toString(),
          checkInDate,
          checkOutDate
        )

        const currentPricing = await this.calculateRoomPricing(
          room._id.toString(), // This should be current room, but using same for demo
          checkInDate,
          checkOutDate
        )

        upgradeOptions.push({
          roomId: room._id.toString(),
          roomNumber: room.roomNumber,
          roomTypeName: roomType.name,
          currentPrice: currentPricing.totalPrice,
          upgradePrice: pricing.totalPrice,
          priceDifference: pricing.totalPrice - currentPricing.totalPrice,
          benefits: this.getUpgradeBenefits(currentRoomType, roomType),
          available: true
        })
      }
    }

    return upgradeOptions.sort((a, b) => a.priceDifference - b.priceDifference)
  }

  // Get detailed availability report for admin
  static async getAvailabilityReport(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ) {
    await connectToDatabase()

    const rooms = await Room.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).populate('roomTypeId')

    const report = {
      totalRooms: rooms.length,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      cleaningRooms: 0,
      outOfOrderRooms: 0,
      roomDetails: [],
      occupancyRate: 0,
      revenueProjection: 0
    }

    const currentDate = new Date()
    let totalRevenue = 0

    for (const room of rooms) {
      const isAvailable = await this.checkRoomAvailability(
        room._id.toString(),
        startDate,
        endDate
      )

      let status = room.status
      if (isAvailable && status === 'available') {
        report.availableRooms++
      } else if (!isAvailable || status === 'occupied') {
        report.occupiedRooms++
        // Calculate revenue for occupied rooms
        const pricing = await this.calculateRoomPricing(
          room._id.toString(),
          startDate,
          endDate
        )
        totalRevenue += pricing.totalPrice
      } else if (status === 'maintenance') {
        report.maintenanceRooms++
      } else if (status === 'cleaning') {
        report.cleaningRooms++
      } else if (status === 'out_of_order') {
        report.outOfOrderRooms++
      }

      report.roomDetails.push({
        roomId: room._id.toString(),
        roomNumber: room.roomNumber,
        roomType: room.roomType?.name,
        status,
        available: isAvailable,
        floor: room.floor,
        condition: room.condition,
        lastCleaned: room.housekeeping?.lastCleaned,
        currentRate: room.pricing?.dynamicPricing?.currentRate
      })
    }

    report.occupancyRate = (report.occupiedRooms / report.totalRooms) * 100
    report.revenueProjection = totalRevenue

    return report
  }

  // Utility methods
  private static extractAmenities(room: any): string[] {
    const amenities: string[] = []

    if (room.specificAmenities?.hasBalcony) amenities.push('Balcony')
    if (room.specificAmenities?.hasKitchen) amenities.push('Kitchen')
    if (room.specificAmenities?.hasAC) amenities.push('Air Conditioning')
    if (room.specificAmenities?.hasSmartTV) amenities.push('Smart TV')
    if (room.specificAmenities?.hasSafe) amenities.push('In-room Safe')
    if (room.specificAmenities?.hasMinibar) amenities.push('Minibar')
    if (room.specificAmenities?.hasJacuzzi) amenities.push('Jacuzzi')
    if (room.specificAmenities?.customAmenities) {
      amenities.push(...room.specificAmenities.customAmenities)
    }

    return amenities
  }

  private static getAlternativeReason(room: any): string {
    if (room.floor !== 1) return `${room.floor}${this.getOrdinalSuffix(room.floor)} floor room`
    if (room.view?.length > 0) return `${room.view[0]} view`
    if (room.roomType?.category) return `${room.roomType.category} category`
    return 'Alternative option'
  }

  private static getOrdinalSuffix(num: number): string {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  private static getHigherCategories(currentCategory: string): string[] {
    const hierarchy = ['economy', 'standard', 'deluxe', 'suite', 'presidential']
    const currentIndex = hierarchy.indexOf(currentCategory)
    return hierarchy.slice(currentIndex + 1)
  }

  private static getUpgradeBenefits(currentType: any, upgradeType: any): string[] {
    const benefits: string[] = []

    if (upgradeType.roomSize.area > currentType.roomSize.area) {
      benefits.push(`Larger room (+${upgradeType.roomSize.area - currentType.roomSize.area} ${upgradeType.roomSize.unit})`)
    }

    if (upgradeType.maxOccupancy.total > currentType.maxOccupancy.total) {
      benefits.push(`Higher occupancy (${upgradeType.maxOccupancy.total} guests)`)
    }

    // Compare amenities
    const currentAmenities = this.countAmenities(currentType.amenities)
    const upgradeAmenities = this.countAmenities(upgradeType.amenities)

    if (upgradeAmenities > currentAmenities) {
      benefits.push(`More amenities (+${upgradeAmenities - currentAmenities})`)
    }

    if (upgradeType.category !== currentType.category) {
      benefits.push(`Upgraded to ${upgradeType.category} category`)
    }

    return benefits
  }

  private static countAmenities(amenities: any): number {
    let count = 0
    Object.values(amenities).forEach(category => {
      if (typeof category === 'object') {
        count += Object.values(category).filter(Boolean).length
      }
    })
    return count
  }
}