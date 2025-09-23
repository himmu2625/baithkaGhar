import { connectToDatabase } from '@/lib/mongodb'

export interface ConsistencyIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  description: string
  bookingId?: string
  propertyId?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  data?: any
  suggestedFix?: string
}

export interface ConsistencyReport {
  summary: {
    totalBookings: number
    issuesFound: number
    criticalIssues: number
    highPriorityIssues: number
    timestamp: Date
  }
  issues: ConsistencyIssue[]
  recommendations: string[]
}

export class BookingConsistencyChecker {
  private issues: ConsistencyIssue[] = []

  async runFullConsistencyCheck(propertyId?: string): Promise<ConsistencyReport> {
    this.issues = []

    try {
      await connectToDatabase()

      // Run all consistency checks
      await Promise.all([
        this.checkDateConsistency(propertyId),
        this.checkPricingConsistency(propertyId),
        this.checkStatusConsistency(propertyId),
        this.checkPaymentConsistency(propertyId),
        this.checkRoomAllocationConsistency(propertyId),
        this.checkGuestDataConsistency(propertyId),
        this.checkOrphanedRecords(propertyId),
        this.checkDuplicateBookings(propertyId),
        this.checkBusinessRuleViolations(propertyId),
        this.checkDataIntegrity(propertyId)
      ])

      const { Booking } = await this.getModels()
      const query = propertyId ? { propertyId } : {}
      const totalBookings = await Booking.countDocuments(query)

      const criticalIssues = this.issues.filter(i => i.severity === 'critical').length
      const highPriorityIssues = this.issues.filter(i => i.severity === 'high').length

      return {
        summary: {
          totalBookings,
          issuesFound: this.issues.length,
          criticalIssues,
          highPriorityIssues,
          timestamp: new Date()
        },
        issues: this.issues,
        recommendations: this.generateRecommendations()
      }
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'system',
        description: `Failed to run consistency check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      })

      return {
        summary: {
          totalBookings: 0,
          issuesFound: this.issues.length,
          criticalIssues: 1,
          highPriorityIssues: 0,
          timestamp: new Date()
        },
        issues: this.issues,
        recommendations: ['Fix system connectivity issues before running consistency checks']
      }
    }
  }

  private async checkDateConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for bookings where check-out is before or same as check-in
      const invalidDateBookings = await Booking.find({
        ...query,
        $expr: { $lte: ['$dateTo', '$dateFrom'] }
      }).lean()

      invalidDateBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'date_consistency',
          description: 'Check-out date is not after check-in date',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'critical',
          data: {
            checkIn: booking.dateFrom,
            checkOut: booking.dateTo
          },
          suggestedFix: 'Update check-out date to be after check-in date'
        })
      })

      // Check for bookings with dates in the far past or future
      const now = new Date()
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
      const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())

      const suspiciousDateBookings = await Booking.find({
        ...query,
        $or: [
          { dateFrom: { $lt: twoYearsAgo } },
          { dateFrom: { $gt: fiveYearsFromNow } },
          { dateTo: { $lt: twoYearsAgo } },
          { dateTo: { $gt: fiveYearsFromNow } }
        ]
      }).lean()

      suspiciousDateBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'date_consistency',
          description: 'Booking has suspicious dates (too far in past or future)',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: {
            checkIn: booking.dateFrom,
            checkOut: booking.dateTo
          },
          suggestedFix: 'Verify and correct booking dates'
        })
      })

      // Check for same-day bookings (might be suspicious)
      const sameDayBookings = await Booking.find({
        ...query,
        $expr: {
          $eq: [
            { $dateToString: { format: '%Y-%m-%d', date: '$dateFrom' } },
            { $dateToString: { format: '%Y-%m-%d', date: '$dateTo' } }
          ]
        }
      }).lean()

      sameDayBookings.forEach(booking => {
        this.addIssue({
          type: 'info',
          category: 'date_consistency',
          description: 'Same-day booking detected',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'low',
          data: {
            checkIn: booking.dateFrom,
            checkOut: booking.dateTo
          }
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'date_consistency',
        description: `Failed to check date consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkPricingConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for bookings with zero or negative prices
      const invalidPriceBookings = await Booking.find({
        ...query,
        $or: [
          { totalPrice: { $lte: 0 } },
          { totalPrice: null },
          { totalPrice: undefined }
        ]
      }).lean()

      invalidPriceBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'pricing_consistency',
          description: 'Booking has invalid total price',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'high',
          data: { totalPrice: booking.totalPrice },
          suggestedFix: 'Set valid total price for booking'
        })
      })

      // Check for extremely high prices (potential data entry errors)
      const highPriceThreshold = 100000 // ₹1,00,000
      const highPriceBookings = await Booking.find({
        ...query,
        totalPrice: { $gt: highPriceThreshold }
      }).lean()

      highPriceBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'pricing_consistency',
          description: 'Booking has unusually high price',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: { totalPrice: booking.totalPrice },
          suggestedFix: 'Verify booking price is correct'
        })
      })

      // Check for pricing inconsistency with stay duration
      const bookingsWithStayDuration = await Booking.aggregate([
        { $match: query },
        {
          $addFields: {
            stayDuration: {
              $divide: [
                { $subtract: ['$dateTo', '$dateFrom'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $match: {
            stayDuration: { $gt: 0 },
            totalPrice: { $gt: 0 }
          }
        },
        {
          $addFields: {
            pricePerNight: { $divide: ['$totalPrice', '$stayDuration'] }
          }
        }
      ])

      const avgPricePerNight = bookingsWithStayDuration.reduce(
        (sum, booking) => sum + booking.pricePerNight,
        0
      ) / bookingsWithStayDuration.length

      const outlierThreshold = avgPricePerNight * 5 // 5x average

      bookingsWithStayDuration.forEach(booking => {
        if (booking.pricePerNight > outlierThreshold) {
          this.addIssue({
            type: 'warning',
            category: 'pricing_consistency',
            description: 'Price per night significantly higher than average',
            bookingId: booking._id?.toString(),
            propertyId: booking.propertyId,
            severity: 'medium',
            data: {
              pricePerNight: booking.pricePerNight,
              averagePricePerNight: avgPricePerNight
            }
          })
        }
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'pricing_consistency',
        description: `Failed to check pricing consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkStatusConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']

      // Check for invalid status values
      const invalidStatusBookings = await Booking.find({
        ...query,
        status: { $nin: validStatuses }
      }).lean()

      invalidStatusBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'status_consistency',
          description: 'Booking has invalid status',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'high',
          data: { status: booking.status },
          suggestedFix: 'Update to valid status value'
        })
      })

      // Check for completed bookings in the future
      const now = new Date()
      const futureCompletedBookings = await Booking.find({
        ...query,
        status: 'completed',
        dateFrom: { $gt: now }
      }).lean()

      futureCompletedBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'status_consistency',
          description: 'Booking marked as completed but check-in is in the future',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: {
            status: booking.status,
            checkInDate: booking.dateFrom
          },
          suggestedFix: 'Review and correct booking status'
        })
      })

      // Check for old pending bookings
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const oldPendingBookings = await Booking.find({
        ...query,
        status: 'pending',
        dateTo: { $lt: threeDaysAgo }
      }).lean()

      oldPendingBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'status_consistency',
          description: 'Booking still pending but check-out date has passed',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: {
            status: booking.status,
            checkOutDate: booking.dateTo
          },
          suggestedFix: 'Update booking status to completed or cancelled'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'status_consistency',
        description: `Failed to check status consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkPaymentConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']

      // Check for invalid payment status
      const invalidPaymentBookings = await Booking.find({
        ...query,
        paymentStatus: { $nin: validPaymentStatuses }
      }).lean()

      invalidPaymentBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'payment_consistency',
          description: 'Booking has invalid payment status',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'high',
          data: { paymentStatus: booking.paymentStatus },
          suggestedFix: 'Update to valid payment status'
        })
      })

      // Check for completed bookings without payment
      const completedUnpaidBookings = await Booking.find({
        ...query,
        status: 'completed',
        paymentStatus: { $nin: ['paid', 'refunded'] }
      }).lean()

      completedUnpaidBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'payment_consistency',
          description: 'Completed booking without payment confirmation',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'high',
          data: {
            status: booking.status,
            paymentStatus: booking.paymentStatus
          },
          suggestedFix: 'Verify payment status and update accordingly'
        })
      })

      // Check for cancelled bookings with paid status
      const cancelledPaidBookings = await Booking.find({
        ...query,
        status: 'cancelled',
        paymentStatus: 'paid'
      }).lean()

      cancelledPaidBookings.forEach(booking => {
        this.addIssue({
          type: 'info',
          category: 'payment_consistency',
          description: 'Cancelled booking with paid status (may need refund processing)',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: {
            status: booking.status,
            paymentStatus: booking.paymentStatus
          },
          suggestedFix: 'Process refund or update payment status'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'payment_consistency',
        description: `Failed to check payment consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkRoomAllocationConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for overlapping room allocations
      const allocatedBookings = await Booking.find({
        ...query,
        'allocatedRoom.roomNumber': { $exists: true },
        status: { $nin: ['cancelled'] }
      }).lean()

      const roomAllocationMap = new Map<string, any[]>()

      allocatedBookings.forEach(booking => {
        const roomKey = `${booking.propertyId}-${booking.allocatedRoom?.roomNumber}`
        if (!roomAllocationMap.has(roomKey)) {
          roomAllocationMap.set(roomKey, [])
        }
        roomAllocationMap.get(roomKey)!.push(booking)
      })

      roomAllocationMap.forEach((bookings, roomKey) => {
        if (bookings.length > 1) {
          // Check for date overlaps
          for (let i = 0; i < bookings.length; i++) {
            for (let j = i + 1; j < bookings.length; j++) {
              const booking1 = bookings[i]
              const booking2 = bookings[j]

              const overlap = this.datesOverlap(
                booking1.dateFrom,
                booking1.dateTo,
                booking2.dateFrom,
                booking2.dateTo
              )

              if (overlap) {
                this.addIssue({
                  type: 'error',
                  category: 'room_allocation',
                  description: 'Overlapping room allocations detected',
                  bookingId: booking1._id?.toString(),
                  propertyId: booking1.propertyId,
                  severity: 'critical',
                  data: {
                    conflictingBookingId: booking2._id?.toString(),
                    roomNumber: booking1.allocatedRoom?.roomNumber,
                    dates: {
                      booking1: { from: booking1.dateFrom, to: booking1.dateTo },
                      booking2: { from: booking2.dateFrom, to: booking2.dateTo }
                    }
                  },
                  suggestedFix: 'Reallocate one of the bookings to a different room'
                })
              }
            }
          }
        }
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'room_allocation',
        description: `Failed to check room allocation consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkGuestDataConsistency(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for bookings without contact details
      const bookingsWithoutContact = await Booking.find({
        ...query,
        $or: [
          { 'contactDetails.name': { $exists: false } },
          { 'contactDetails.name': '' },
          { 'contactDetails.email': { $exists: false } },
          { 'contactDetails.email': '' }
        ]
      }).lean()

      bookingsWithoutContact.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'guest_data',
          description: 'Booking missing essential contact details',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: { contactDetails: booking.contactDetails },
          suggestedFix: 'Add missing contact information'
        })
      })

      // Check for invalid email formats
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmailBookings = await Booking.find({
        ...query,
        'contactDetails.email': { $exists: true, $ne: '' }
      }).lean()

      invalidEmailBookings.forEach(booking => {
        if (booking.contactDetails?.email && !emailRegex.test(booking.contactDetails.email)) {
          this.addIssue({
            type: 'warning',
            category: 'guest_data',
            description: 'Invalid email format',
            bookingId: booking._id?.toString(),
            propertyId: booking.propertyId,
            severity: 'low',
            data: { email: booking.contactDetails.email },
            suggestedFix: 'Correct email format'
          })
        }
      })

      // Check for unrealistic guest counts
      const unrealisticGuestBookings = await Booking.find({
        ...query,
        $or: [
          { guests: { $lte: 0 } },
          { guests: { $gt: 50 } }
        ]
      }).lean()

      unrealisticGuestBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'guest_data',
          description: 'Unrealistic guest count',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: { guests: booking.guests },
          suggestedFix: 'Verify and correct guest count'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'guest_data',
        description: `Failed to check guest data consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkOrphanedRecords(propertyId?: string): Promise<void> {
    try {
      const { Booking, Property, User } = await this.getModels()

      // Check for bookings with non-existent properties
      const allPropertyIds = await Property.distinct('_id')
      const query = propertyId ? { propertyId } : {}

      const orphanedBookings = await Booking.find({
        ...query,
        propertyId: { $nin: allPropertyIds }
      }).lean()

      orphanedBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'orphaned_records',
          description: 'Booking references non-existent property',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'high',
          suggestedFix: 'Remove orphaned booking or create missing property'
        })
      })

      // Check for bookings with non-existent users (if userId is set)
      const allUserIds = await User.distinct('_id')
      const orphanedUserBookings = await Booking.find({
        ...query,
        userId: { $exists: true, $nin: allUserIds }
      }).lean()

      orphanedUserBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'orphaned_records',
          description: 'Booking references non-existent user',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: { userId: booking.userId },
          suggestedFix: 'Update or remove invalid user reference'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'orphaned_records',
        description: `Failed to check orphaned records: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkDuplicateBookings(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()

    try {
      const pipeline = [
        ...(propertyId ? [{ $match: { propertyId } }] : []),
        {
          $group: {
            _id: {
              propertyId: '$propertyId',
              email: '$contactDetails.email',
              dateFrom: '$dateFrom',
              dateTo: '$dateTo'
            },
            count: { $sum: 1 },
            bookings: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]

      const duplicates = await Booking.aggregate(pipeline)

      duplicates.forEach(duplicate => {
        duplicate.bookings.forEach((bookingId: string, index: number) => {
          if (index > 0) { // First one is kept, others are flagged as duplicates
            this.addIssue({
              type: 'warning',
              category: 'duplicate_bookings',
              description: 'Potential duplicate booking detected',
              bookingId: bookingId.toString(),
              propertyId: duplicate._id.propertyId,
              severity: 'medium',
              data: {
                originalBookingId: duplicate.bookings[0].toString(),
                duplicateCount: duplicate.count
              },
              suggestedFix: 'Review and remove duplicate booking if confirmed'
            })
          }
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'duplicate_bookings',
        description: `Failed to check duplicate bookings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkBusinessRuleViolations(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for bookings violating minimum stay requirements
      const shortStayBookings = await Booking.aggregate([
        { $match: query },
        {
          $addFields: {
            stayDuration: {
              $divide: [
                { $subtract: ['$dateTo', '$dateFrom'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        { $match: { stayDuration: { $lt: 1 } } }
      ])

      shortStayBookings.forEach(booking => {
        this.addIssue({
          type: 'warning',
          category: 'business_rules',
          description: 'Booking violates minimum stay requirement',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'medium',
          data: { stayDuration: booking.stayDuration },
          suggestedFix: 'Extend stay duration or apply business rule exception'
        })
      })

      // Check for advance booking violations
      const now = new Date()
      const maxAdvanceBooking = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())

      const farAdvanceBookings = await Booking.find({
        ...query,
        dateFrom: { $gt: maxAdvanceBooking }
      }).lean()

      farAdvanceBookings.forEach(booking => {
        this.addIssue({
          type: 'info',
          category: 'business_rules',
          description: 'Booking made too far in advance',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'low',
          data: { checkInDate: booking.dateFrom },
          suggestedFix: 'Verify booking policy compliance'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'business_rules',
        description: `Failed to check business rule violations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private async checkDataIntegrity(propertyId?: string): Promise<void> {
    const { Booking } = await this.getModels()
    const query = propertyId ? { propertyId } : {}

    try {
      // Check for missing required fields
      const requiredFields = ['propertyId', 'dateFrom', 'dateTo', 'status']

      for (const field of requiredFields) {
        const missingFieldBookings = await Booking.find({
          ...query,
          [field]: { $exists: false }
        }).lean()

        missingFieldBookings.forEach(booking => {
          this.addIssue({
            type: 'error',
            category: 'data_integrity',
            description: `Missing required field: ${field}`,
            bookingId: booking._id?.toString(),
            propertyId: booking.propertyId,
            severity: 'critical',
            data: { missingField: field },
            suggestedFix: `Add missing ${field} value`
          })
        })
      }

      // Check for null or undefined critical values
      const nullValueBookings = await Booking.find({
        ...query,
        $or: [
          { dateFrom: null },
          { dateTo: null },
          { status: null },
          { propertyId: null }
        ]
      }).lean()

      nullValueBookings.forEach(booking => {
        this.addIssue({
          type: 'error',
          category: 'data_integrity',
          description: 'Critical field has null value',
          bookingId: booking._id?.toString(),
          propertyId: booking.propertyId,
          severity: 'critical',
          suggestedFix: 'Replace null values with valid data'
        })
      })
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'data_integrity',
        description: `Failed to check data integrity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      })
    }
  }

  private addIssue(issue: ConsistencyIssue): void {
    this.issues.push(issue)
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const issuesByCategory = this.groupIssuesByCategory()

    if (issuesByCategory.critical > 0) {
      recommendations.push('Address critical issues immediately - they may affect system functionality')
    }

    if (issuesByCategory.date_consistency > 0) {
      recommendations.push('Review and correct date inconsistencies to ensure accurate reporting')
    }

    if (issuesByCategory.payment_consistency > 0) {
      recommendations.push('Reconcile payment statuses with actual payment records')
    }

    if (issuesByCategory.room_allocation > 0) {
      recommendations.push('Resolve room allocation conflicts to prevent overbooking')
    }

    if (issuesByCategory.orphaned_records > 0) {
      recommendations.push('Clean up orphaned records to maintain database integrity')
    }

    if (issuesByCategory.duplicate_bookings > 0) {
      recommendations.push('Implement duplicate detection to prevent future duplicates')
    }

    if (this.issues.length > 50) {
      recommendations.push('Consider running data cleanup procedures due to high issue count')
    }

    if (recommendations.length === 0) {
      recommendations.push('All consistency checks passed - maintain regular monitoring')
    }

    return recommendations
  }

  private groupIssuesByCategory(): Record<string, number> {
    const groups: Record<string, number> = {}

    this.issues.forEach(issue => {
      groups[issue.category] = (groups[issue.category] || 0) + 1
      groups[issue.severity] = (groups[issue.severity] || 0) + 1
    })

    return groups
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1
  }

  private async getModels() {
    const [Booking, Property, User] = await Promise.all([
      import('@/models/Booking').then(m => m.default),
      import('@/models/Property').then(m => m.default),
      import('@/models/User').then(m => m.default)
    ])

    return { Booking, Property, User }
  }
}

// Utility function to run consistency check
export async function runBookingConsistencyCheck(propertyId?: string): Promise<ConsistencyReport> {
  const checker = new BookingConsistencyChecker()
  return await checker.runFullConsistencyCheck(propertyId)
}

export default BookingConsistencyChecker