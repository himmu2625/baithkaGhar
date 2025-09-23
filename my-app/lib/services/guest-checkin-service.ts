import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import { addDays, format, differenceInHours } from 'date-fns'

export interface CheckInRequest {
  bookingId: string
  guestDocuments: Array<{
    type: 'passport' | 'drivers_license' | 'aadhar' | 'pan' | 'voter_id' | 'other'
    number: string
    expiryDate?: Date
    issuingAuthority?: string
    frontImage?: string
    backImage?: string
    verificationStatus: 'pending' | 'verified' | 'rejected'
  }>
  actualCheckInTime: Date
  actualGuestCount: {
    adults: number
    children: number
  }
  additionalGuests?: Array<{
    name: string
    relationship: string
    age?: number
    documentType?: string
    documentNumber?: string
  }>
  specialRequests?: string
  roomPreferences?: {
    floor?: number
    view?: string
    amenities?: string[]
  }
  checkedInBy: string
  notes?: string
}

export interface CheckOutRequest {
  bookingId: string
  actualCheckOutTime: Date
  roomCondition: {
    cleanliness: 'excellent' | 'good' | 'fair' | 'poor'
    damages: Array<{
      item: string
      description: string
      severity: 'minor' | 'moderate' | 'major'
      estimatedCost?: number
      image?: string
    }>
    missingItems: Array<{
      item: string
      quantity: number
      cost: number
    }>
    additionalCleaning: boolean
    cleaningNotes?: string
  }
  guestFeedback?: {
    rating: number
    comments: string
    wouldRecommend: boolean
  }
  charges?: Array<{
    type: 'damage' | 'cleaning' | 'extra_service' | 'minibar' | 'laundry' | 'other'
    description: string
    amount: number
  }>
  checkedOutBy: string
  notes?: string
}

export interface CheckInResponse {
  success: boolean
  checkInId?: string
  roomAssigned?: {
    roomId: string
    roomNumber: string
    floor: number
    amenities: string[]
  }
  keyCards?: string[]
  welcomePackage?: {
    items: string[]
    instructions: string[]
  }
  error?: string
}

export interface CheckOutResponse {
  success: boolean
  checkOutId?: string
  finalBill?: {
    roomCharges: number
    additionalCharges: number
    taxes: number
    totalAmount: number
    refundAmount?: number
  }
  receipt?: string
  error?: string
}

export interface GuestStayStatus {
  bookingId: string
  guestName: string
  roomNumber: string
  checkInTime: Date
  expectedCheckOut: Date
  status: 'checked_in' | 'extended' | 'early_checkout' | 'no_show'
  stayDuration: string
  remainingNights: number
  lastActivity: Date
  requests: number
  feedbackProvided: boolean
}

export class GuestCheckInService {
  // Process guest check-in
  static async processCheckIn(request: CheckInRequest): Promise<CheckInResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(request.bookingId)
        .populate('propertyId')
        .populate('allocatedRoom.roomId')

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      // Validate booking status
      if (booking.status !== 'confirmed') {
        return {
          success: false,
          error: 'Booking is not confirmed'
        }
      }

      if (booking.checkInStatus === 'checked_in') {
        return {
          success: false,
          error: 'Guest is already checked in'
        }
      }

      // Validate check-in timing
      const checkInValidation = this.validateCheckInTiming(booking, request.actualCheckInTime)
      if (!checkInValidation.valid) {
        return {
          success: false,
          error: checkInValidation.reason
        }
      }

      // Assign room if not already allocated
      let roomAssignment = booking.allocatedRoom
      if (!roomAssignment?.roomId) {
        const { RoomAllocationService } = await import('./room-allocation-service')
        const allocationResult = await RoomAllocationService.allocateRoom({
          propertyId: booking.propertyId._id.toString(),
          checkInDate: booking.dateFrom,
          checkOutDate: booking.dateTo,
          guestCount: request.actualGuestCount.adults + request.actualGuestCount.children,
          preferences: request.roomPreferences
        })

        if (!allocationResult.success || !allocationResult.allocatedRoom) {
          return {
            success: false,
            error: 'No rooms available for check-in'
          }
        }

        roomAssignment = allocationResult.allocatedRoom
      }

      // Update room status
      const room = await Room.findById(roomAssignment.roomId)
      if (room) {
        room.status = 'occupied'
        room.currentBooking = {
          bookingId: booking._id,
          guestName: booking.contactDetails?.name || booking.guestName,
          checkIn: request.actualCheckInTime,
          checkOut: booking.dateTo,
          guestCount: request.actualGuestCount.adults + request.actualGuestCount.children,
          specialRequests: request.specialRequests
        }
        await room.save()
      }

      // Generate check-in ID
      const checkInId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Update booking with check-in details
      booking.checkInStatus = 'checked_in'
      booking.actualCheckInTime = request.actualCheckInTime
      booking.actualGuestCount = request.actualGuestCount
      booking.guestDocuments = request.guestDocuments
      booking.additionalGuests = request.additionalGuests
      booking.allocatedRoom = roomAssignment

      if (!booking.checkInHistory) {
        booking.checkInHistory = []
      }

      booking.checkInHistory.push({
        checkInId,
        checkInTime: request.actualCheckInTime,
        guestCount: request.actualGuestCount,
        roomAssigned: roomAssignment,
        checkedInBy: request.checkedInBy,
        documents: request.guestDocuments,
        additionalGuests: request.additionalGuests,
        specialRequests: request.specialRequests,
        notes: request.notes
      })

      await booking.save()

      // Generate key cards
      const keyCards = await this.generateKeyCards(roomAssignment.roomId, booking._id.toString())

      // Prepare welcome package
      const welcomePackage = await this.prepareWelcomePackage(booking, room)

      // Send welcome communications
      await this.sendWelcomeMessages(booking)

      return {
        success: true,
        checkInId,
        roomAssigned: {
          roomId: roomAssignment.roomId,
          roomNumber: roomAssignment.roomNumber,
          floor: roomAssignment.floor || 1,
          amenities: roomAssignment.amenities || []
        },
        keyCards,
        welcomePackage
      }

    } catch (error) {
      console.error('Check-in processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process guest check-out
  static async processCheckOut(request: CheckOutRequest): Promise<CheckOutResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(request.bookingId)
        .populate('propertyId')
        .populate('allocatedRoom.roomId')

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      if (booking.checkInStatus !== 'checked_in') {
        return {
          success: false,
          error: 'Guest is not checked in'
        }
      }

      if (booking.checkOutStatus === 'checked_out') {
        return {
          success: false,
          error: 'Guest is already checked out'
        }
      }

      // Calculate final bill
      const finalBill = await this.calculateFinalBill(booking, request.charges)

      // Generate check-out ID
      const checkOutId = `CO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Update room status and condition
      if (booking.allocatedRoom?.roomId) {
        const room = await Room.findById(booking.allocatedRoom.roomId)
        if (room) {
          room.status = request.roomCondition.additionalCleaning ? 'cleaning' : 'available'
          room.currentBooking = undefined
          room.condition = this.mapCleanlinessToCondition(request.roomCondition.cleanliness)

          // Log damages and missing items
          if (request.roomCondition.damages.length > 0 || request.roomCondition.missingItems.length > 0) {
            if (!room.maintenance) room.maintenance = { maintenanceHistory: [], currentIssues: [] }

            request.roomCondition.damages.forEach(damage => {
              room.maintenance.currentIssues.push({
                issueType: 'other',
                description: `${damage.item}: ${damage.description}`,
                severity: damage.severity,
                reportedBy: request.checkedOutBy,
                reportedAt: new Date(),
                status: 'reported',
                cost: damage.estimatedCost
              })
            })
          }

          // Update housekeeping status
          room.housekeeping.cleaningStatus = request.roomCondition.additionalCleaning
            ? 'maintenance_required'
            : 'dirty'

          if (request.roomCondition.cleaningNotes) {
            room.housekeeping.cleaningNotes = request.roomCondition.cleaningNotes
          }

          await room.save()
        }
      }

      // Update booking with check-out details
      booking.checkOutStatus = 'checked_out'
      booking.actualCheckOutTime = request.actualCheckOutTime
      booking.roomConditionAtCheckOut = request.roomCondition
      booking.additionalCharges = request.charges

      if (request.guestFeedback) {
        booking.guestFeedback = {
          rating: request.guestFeedback.rating,
          comments: request.guestFeedback.comments,
          wouldRecommend: request.guestFeedback.wouldRecommend,
          submittedAt: new Date()
        }
      }

      if (!booking.checkOutHistory) {
        booking.checkOutHistory = []
      }

      booking.checkOutHistory.push({
        checkOutId,
        checkOutTime: request.actualCheckOutTime,
        roomCondition: request.roomCondition,
        additionalCharges: request.charges,
        finalBill,
        checkedOutBy: request.checkedOutBy,
        guestFeedback: request.guestFeedback,
        notes: request.notes
      })

      // Update booking status to completed
      booking.status = 'completed'

      await booking.save()

      // Process any additional charges
      if (finalBill.additionalCharges > 0) {
        await this.processAdditionalCharges(booking, finalBill.additionalCharges)
      }

      // Generate receipt
      const receipt = await this.generateReceipt(booking, finalBill)

      // Send thank you message
      await this.sendThankYouMessages(booking)

      return {
        success: true,
        checkOutId,
        finalBill,
        receipt
      }

    } catch (error) {
      console.error('Check-out processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get current guest stays
  static async getCurrentStays(propertyId: string): Promise<GuestStayStatus[]> {
    try {
      await connectToDatabase()

      const bookings = await Booking.find({
        propertyId,
        checkInStatus: 'checked_in',
        checkOutStatus: { $ne: 'checked_out' }
      }).populate('allocatedRoom.roomId')

      const stays: GuestStayStatus[] = []

      for (const booking of bookings) {
        const checkInTime = booking.actualCheckInTime || booking.dateFrom
        const expectedCheckOut = booking.dateTo
        const now = new Date()

        // Calculate stay duration
        const hoursStayed = differenceInHours(now, checkInTime)
        const stayDuration = this.formatDuration(hoursStayed)

        // Calculate remaining nights
        const remainingNights = Math.max(0, Math.ceil((expectedCheckOut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        // Determine status
        let status: 'checked_in' | 'extended' | 'early_checkout' | 'no_show' = 'checked_in'
        if (now > expectedCheckOut) {
          status = 'extended'
        }

        stays.push({
          bookingId: booking._id.toString(),
          guestName: booking.contactDetails?.name || booking.guestName || 'Unknown',
          roomNumber: booking.allocatedRoom?.roomNumber || 'TBA',
          checkInTime,
          expectedCheckOut,
          status,
          stayDuration,
          remainingNights,
          lastActivity: booking.updatedAt || booking.actualCheckInTime || booking.dateFrom,
          requests: booking.serviceRequests?.length || 0,
          feedbackProvided: !!booking.guestFeedback
        })
      }

      return stays.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))

    } catch (error) {
      console.error('Get current stays error:', error)
      throw error
    }
  }

  // Handle early check-in requests
  static async handleEarlyCheckIn(
    bookingId: string,
    requestedTime: Date,
    fee?: number
  ): Promise<{
    allowed: boolean
    fee?: number
    reason?: string
    availableFrom?: Date
  }> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          allowed: false,
          reason: 'Booking not found'
        }
      }

      const standardCheckIn = booking.dateFrom
      const property = booking.propertyId

      // Check if early check-in is possible
      const hoursDifference = differenceInHours(standardCheckIn, requestedTime)

      if (hoursDifference <= 0) {
        return {
          allowed: true,
          reason: 'No early check-in required'
        }
      }

      // Check room availability
      if (booking.allocatedRoom?.roomId) {
        const room = await Room.findById(booking.allocatedRoom.roomId)
        if (room && room.status !== 'available') {
          // Find the earliest available time
          const nextAvailable = await this.findNextAvailableTime(room._id.toString(), requestedTime)
          return {
            allowed: false,
            reason: 'Room not ready for early check-in',
            availableFrom: nextAvailable
          }
        }
      }

      // Calculate early check-in fee
      const earlyCheckInFee = fee || this.calculateEarlyCheckInFee(hoursDifference, property)

      return {
        allowed: true,
        fee: earlyCheckInFee,
        reason: `Early check-in available with ${hoursDifference} hours advance`
      }

    } catch (error) {
      console.error('Early check-in handling error:', error)
      return {
        allowed: false,
        reason: 'Error processing early check-in request'
      }
    }
  }

  // Handle late check-out requests
  static async handleLateCheckOut(
    bookingId: string,
    requestedTime: Date,
    fee?: number
  ): Promise<{
    allowed: boolean
    fee?: number
    reason?: string
    maxExtension?: Date
  }> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(bookingId).populate('propertyId')
      if (!booking) {
        return {
          allowed: false,
          reason: 'Booking not found'
        }
      }

      const standardCheckOut = booking.dateTo
      const property = booking.propertyId

      // Check if late check-out is requested
      const hoursDifference = differenceInHours(requestedTime, standardCheckOut)

      if (hoursDifference <= 0) {
        return {
          allowed: true,
          reason: 'No late check-out required'
        }
      }

      // Check room availability for next booking
      if (booking.allocatedRoom?.roomId) {
        const nextBooking = await Booking.findOne({
          'allocatedRoom.roomId': booking.allocatedRoom.roomId,
          dateFrom: { $gte: standardCheckOut },
          status: 'confirmed'
        }).sort({ dateFrom: 1 })

        if (nextBooking) {
          const maxPossibleExtension = addDays(nextBooking.dateFrom, -0.5) // 12 hours before next booking
          if (requestedTime > maxPossibleExtension) {
            return {
              allowed: false,
              reason: 'Room needed for next guest',
              maxExtension: maxPossibleExtension
            }
          }
        }
      }

      // Calculate late check-out fee
      const lateCheckOutFee = fee || this.calculateLateCheckOutFee(hoursDifference, property)

      return {
        allowed: true,
        fee: lateCheckOutFee,
        reason: `Late check-out available with ${hoursDifference} hours extension`
      }

    } catch (error) {
      console.error('Late check-out handling error:', error)
      return {
        allowed: false,
        reason: 'Error processing late check-out request'
      }
    }
  }

  // Private helper methods
  private static validateCheckInTiming(booking: any, checkInTime: Date): { valid: boolean; reason?: string } {
    const now = new Date()
    const bookingCheckIn = new Date(booking.dateFrom)
    const bookingCheckOut = new Date(booking.dateTo)

    // Check if trying to check in too early (more than 24 hours before)
    const hoursDiff = differenceInHours(bookingCheckIn, checkInTime)
    if (hoursDiff > 24) {
      return {
        valid: false,
        reason: 'Check-in is too early. Early check-in requests must be approved.'
      }
    }

    // Check if trying to check in after check-out date
    if (checkInTime >= bookingCheckOut) {
      return {
        valid: false,
        reason: 'Cannot check in after the booking check-out date'
      }
    }

    return { valid: true }
  }

  private static async generateKeyCards(roomId: string, bookingId: string): Promise<string[]> {
    // In production, integrate with key card system
    // For now, generate mock key card numbers
    return [
      `KEY-${roomId.slice(-4)}-${bookingId.slice(-4)}-1`,
      `KEY-${roomId.slice(-4)}-${bookingId.slice(-4)}-2`
    ]
  }

  private static async prepareWelcomePackage(booking: any, room: any): Promise<any> {
    const property = booking.propertyId

    return {
      items: [
        'Room key cards',
        'Welcome letter',
        'Property information brochure',
        'Local area guide',
        'WiFi password card',
        'Emergency contact numbers'
      ],
      instructions: [
        `WiFi Password: ${property.wifiPassword || 'Available at front desk'}`,
        `Check-out time: ${property.checkOutTime || '11:00 AM'}`,
        `Emergency contact: ${property.contactDetails?.phone || 'Front desk'}`,
        'Please keep your key cards safe',
        'Enjoy your stay!'
      ]
    }
  }

  private static async sendWelcomeMessages(booking: any): Promise<void> {
    try {
      // Send welcome SMS and WhatsApp
      const { SMSService } = await import('./sms-service')
      const { WhatsAppService } = await import('./whatsapp-service')

      // Welcome SMS
      const phone = booking.contactDetails?.phone || booking.phone
      if (phone) {
        const welcomeMessage = `Welcome to ${booking.propertyId.title}! You're checked into room ${booking.allocatedRoom?.roomNumber}. Have a wonderful stay! - Baithaka GHAR`

        await SMSService.sendCustomMessage({
          to: phone,
          message: welcomeMessage,
          priority: 'normal',
          category: 'notification'
        })

        // Welcome WhatsApp with location
        await WhatsAppService.sendPropertyLocation(booking._id.toString())
      }

    } catch (error) {
      console.error('Send welcome messages error:', error)
    }
  }

  private static async calculateFinalBill(booking: any, additionalCharges: any[] = []): Promise<any> {
    const roomCharges = booking.totalPrice || 0
    const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
    const taxes = (roomCharges + additionalChargesTotal) * 0.12 // 12% GST
    const totalAmount = roomCharges + additionalChargesTotal + taxes

    return {
      roomCharges,
      additionalCharges: additionalChargesTotal,
      taxes,
      totalAmount,
      breakdown: {
        baseCharges: roomCharges,
        additionalServices: additionalCharges,
        gst: taxes
      }
    }
  }

  private static mapCleanlinessToCondition(cleanliness: string): string {
    switch (cleanliness) {
      case 'excellent': return 'excellent'
      case 'good': return 'good'
      case 'fair': return 'fair'
      case 'poor': return 'needs_renovation'
      default: return 'good'
    }
  }

  private static async processAdditionalCharges(booking: any, amount: number): Promise<void> {
    // In production, process additional payment
    console.log(`Processing additional charges of ₹${amount} for booking ${booking._id}`)
  }

  private static async generateReceipt(booking: any, finalBill: any): Promise<string> {
    // In production, generate PDF receipt
    return `receipt_${booking._id}_${Date.now()}.pdf`
  }

  private static async sendThankYouMessages(booking: any): Promise<void> {
    try {
      const { EmailService } = await import('./email-service')

      // Send thank you and feedback email
      await EmailService.sendThankYouAndFeedback(booking._id.toString())

    } catch (error) {
      console.error('Send thank you messages error:', error)
    }
  }

  private static formatDuration(hours: number): string {
    if (hours < 24) {
      return `${Math.floor(hours)} hours`
    }

    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`
    }

    return `${days} day${days > 1 ? 's' : ''}, ${Math.floor(remainingHours)} hours`
  }

  private static async findNextAvailableTime(roomId: string, requestedTime: Date): Promise<Date> {
    // In production, check housekeeping schedule and room status
    // For now, return 2 hours later
    return addDays(requestedTime, 0.083) // 2 hours
  }

  private static calculateEarlyCheckInFee(hours: number, property: any): number {
    // Base fee structure - can be customized per property
    if (hours <= 2) return 500
    if (hours <= 4) return 1000
    if (hours <= 6) return 1500
    return 2000
  }

  private static calculateLateCheckOutFee(hours: number, property: any): number {
    // Base fee structure - can be customized per property
    if (hours <= 2) return 500
    if (hours <= 4) return 1000
    if (hours <= 6) return 1500
    return 2000 // Full day charge for more than 6 hours
  }
}