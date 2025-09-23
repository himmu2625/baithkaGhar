import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { PaymentService } from './payment-service'
import { addDays, addHours, differenceInDays, isBefore, isAfter } from 'date-fns'

export interface PartialPaymentPlan {
  planId: string
  bookingId: string
  totalAmount: number
  installments: Array<{
    installmentNumber: number
    amount: number
    dueDate: Date
    description: string
    status: 'pending' | 'paid' | 'overdue' | 'failed'
    paymentId?: string
    paidAt?: Date
    remindersSent: number
    lastReminderAt?: Date
  }>
  planType: 'fixed' | 'flexible' | 'custom'
  createdAt: Date
  approvedBy: string
  terms: {
    lateFeePercentage: number
    gracePeriodDays: number
    cancellationPolicy: string
    minimumInstallmentAmount: number
  }
  status: 'active' | 'completed' | 'cancelled' | 'defaulted'
  autoReminderEnabled: boolean
  notes?: string
}

export interface PartialPaymentTemplate {
  templateId: string
  name: string
  description: string
  propertyId?: string
  roomTypeId?: string
  applicableFor: {
    minimumAmount: number
    bookingLeadTime: number // days
    seasons?: string[]
  }
  installmentConfig: {
    numberOfInstallments: number
    schedule: Array<{
      installmentNumber: number
      percentage: number
      daysFromBooking: number
      description: string
    }>
  }
  terms: {
    lateFeePercentage: number
    gracePeriodDays: number
    cancellationPolicy: string
    minimumInstallmentAmount: number
  }
  isActive: boolean
  createdBy: string
  createdAt: Date
}

export interface PartialPaymentRequest {
  bookingId: string
  requestedBy: string
  requestType: 'guest_initiated' | 'admin_offered'
  templateId?: string
  customSchedule?: Array<{
    amount: number
    dueDate: Date
    description: string
  }>
  reason: string
  notes?: string
}

export interface PartialPaymentResponse {
  success: boolean
  planId?: string
  plan?: PartialPaymentPlan
  error?: string
  requiresApproval?: boolean
  nextPaymentDue?: {
    amount: number
    dueDate: Date
    description: string
  }
}

export class PartialPaymentService {
  // Create partial payment plan
  static async createPartialPaymentPlan(request: PartialPaymentRequest): Promise<PartialPaymentResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findById(request.bookingId)
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      // Check if booking is eligible for partial payments
      const eligibilityCheck = await this.checkEligibility(booking)
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          error: eligibilityCheck.reason
        }
      }

      const planId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      let installments: any[] = []

      if (request.templateId) {
        // Use template
        const template = await this.getTemplate(request.templateId)
        if (!template) {
          return {
            success: false,
            error: 'Payment template not found'
          }
        }

        installments = this.generateInstallmentsFromTemplate(booking, template)
      } else if (request.customSchedule) {
        // Use custom schedule
        installments = request.customSchedule.map((item, index) => ({
          installmentNumber: index + 1,
          amount: item.amount,
          dueDate: item.dueDate,
          description: item.description,
          status: 'pending',
          remindersSent: 0
        }))
      } else {
        // Generate default plan
        installments = this.generateDefaultInstallments(booking)
      }

      // Validate installments
      const validation = this.validateInstallments(installments, booking.totalPrice)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      const plan: PartialPaymentPlan = {
        planId,
        bookingId: request.bookingId,
        totalAmount: booking.totalPrice || 0,
        installments,
        planType: request.templateId ? 'fixed' : request.customSchedule ? 'custom' : 'flexible',
        createdAt: new Date(),
        approvedBy: request.requestedBy,
        terms: {
          lateFeePercentage: 2.5,
          gracePeriodDays: 3,
          cancellationPolicy: 'Standard cancellation policy applies',
          minimumInstallmentAmount: 1000
        },
        status: 'active',
        autoReminderEnabled: true,
        notes: request.notes
      }

      // Save to booking
      if (!booking.partialPaymentPlans) {
        booking.partialPaymentPlans = []
      }
      booking.partialPaymentPlans.push(plan)

      // Update booking status
      booking.paymentStatus = 'partial_plan'
      booking.paymentPlan = {
        type: 'partial',
        planId,
        nextDueDate: installments[0].dueDate,
        nextDueAmount: installments[0].amount
      }

      await booking.save()

      return {
        success: true,
        planId,
        plan,
        nextPaymentDue: {
          amount: installments[0].amount,
          dueDate: installments[0].dueDate,
          description: installments[0].description
        }
      }

    } catch (error) {
      console.error('Create partial payment plan error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process installment payment
  static async processInstallmentPayment(
    planId: string,
    installmentNumber: number,
    paymentDetails?: {
      paymentMethod?: string
      customerDetails?: any
    }
  ): Promise<PartialPaymentResponse> {
    try {
      await connectToDatabase()

      const booking = await Booking.findOne({
        'partialPaymentPlans.planId': planId
      })

      if (!booking) {
        return {
          success: false,
          error: 'Payment plan not found'
        }
      }

      const planIndex = booking.partialPaymentPlans.findIndex(
        (plan: any) => plan.planId === planId
      )

      if (planIndex === -1) {
        return {
          success: false,
          error: 'Payment plan not found'
        }
      }

      const plan = booking.partialPaymentPlans[planIndex]

      // Find the installment
      const installmentIndex = plan.installments.findIndex(
        (inst: any) => inst.installmentNumber === installmentNumber
      )

      if (installmentIndex === -1) {
        return {
          success: false,
          error: 'Installment not found'
        }
      }

      const installment = plan.installments[installmentIndex]

      if (installment.status === 'paid') {
        return {
          success: false,
          error: 'Installment already paid'
        }
      }

      // Create payment order
      const paymentResponse = await PaymentService.createPaymentOrder({
        bookingId: booking._id.toString(),
        amount: installment.amount,
        currency: 'INR',
        description: `${installment.description} (Installment ${installmentNumber}/${plan.installments.length})`,
        customerDetails: paymentDetails?.customerDetails || {
          name: booking.contactDetails?.name || booking.guestName || 'Guest',
          email: booking.contactDetails?.email || booking.email || '',
          contact: booking.contactDetails?.phone || booking.phone || ''
        },
        paymentType: 'partial',
        metadata: {
          planId,
          installmentNumber,
          isInstallment: true
        }
      })

      if (!paymentResponse.success) {
        return {
          success: false,
          error: paymentResponse.errorDescription || 'Failed to create payment order'
        }
      }

      // Update installment with payment details
      installment.paymentOrderId = paymentResponse.orderId
      installment.status = 'pending'

      await booking.save()

      return {
        success: true,
        planId,
        nextPaymentDue: this.getNextInstallment(plan)
      }

    } catch (error) {
      console.error('Process installment payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Mark installment as paid
  static async markInstallmentPaid(
    planId: string,
    installmentNumber: number,
    paymentId: string
  ): Promise<boolean> {
    try {
      await connectToDatabase()

      const booking = await Booking.findOne({
        'partialPaymentPlans.planId': planId
      })

      if (!booking) return false

      const planIndex = booking.partialPaymentPlans.findIndex(
        (plan: any) => plan.planId === planId
      )

      if (planIndex === -1) return false

      const plan = booking.partialPaymentPlans[planIndex]
      const installmentIndex = plan.installments.findIndex(
        (inst: any) => inst.installmentNumber === installmentNumber
      )

      if (installmentIndex === -1) return false

      // Update installment
      plan.installments[installmentIndex].status = 'paid'
      plan.installments[installmentIndex].paymentId = paymentId
      plan.installments[installmentIndex].paidAt = new Date()

      // Check if all installments are paid
      const allPaid = plan.installments.every((inst: any) => inst.status === 'paid')

      if (allPaid) {
        plan.status = 'completed'
        booking.paymentStatus = 'completed'
        booking.status = booking.status === 'pending' ? 'confirmed' : booking.status
      } else {
        // Update next due information
        const nextInstallment = this.getNextInstallment(plan)
        if (nextInstallment) {
          booking.paymentPlan.nextDueDate = nextInstallment.dueDate
          booking.paymentPlan.nextDueAmount = nextInstallment.amount
        }
      }

      await booking.save()
      return true

    } catch (error) {
      console.error('Mark installment paid error:', error)
      return false
    }
  }

  // Get overdue installments
  static async getOverdueInstallments(propertyId?: string): Promise<Array<{
    planId: string
    bookingId: string
    bookingReference: string
    guestName: string
    installmentNumber: number
    amount: number
    dueDate: Date
    daysOverdue: number
    lateFee: number
    totalAmount: number
    contactDetails: any
  }>> {
    try {
      await connectToDatabase()

      const query: any = {
        'partialPaymentPlans.status': 'active'
      }

      if (propertyId) {
        query.propertyId = propertyId
      }

      const bookings = await Booking.find(query)

      const overdueInstallments = []
      const today = new Date()

      for (const booking of bookings) {
        for (const plan of booking.partialPaymentPlans || []) {
          if (plan.status !== 'active') continue

          for (const installment of plan.installments) {
            if (installment.status === 'pending' && isBefore(installment.dueDate, today)) {
              const daysOverdue = differenceInDays(today, installment.dueDate)

              if (daysOverdue > plan.terms.gracePeriodDays) {
                const lateFee = (installment.amount * plan.terms.lateFeePercentage) / 100

                // Update installment status to overdue
                installment.status = 'overdue'

                overdueInstallments.push({
                  planId: plan.planId,
                  bookingId: booking._id.toString(),
                  bookingReference: booking.bookingReference || booking._id.toString().slice(-8),
                  guestName: booking.contactDetails?.name || booking.guestName || 'Unknown',
                  installmentNumber: installment.installmentNumber,
                  amount: installment.amount,
                  dueDate: installment.dueDate,
                  daysOverdue,
                  lateFee,
                  totalAmount: installment.amount + lateFee,
                  contactDetails: {
                    email: booking.contactDetails?.email || booking.email,
                    phone: booking.contactDetails?.phone || booking.phone
                  }
                })
              }
            }
          }
        }
      }

      // Save updated statuses
      await Promise.all(
        bookings.map(booking => booking.save())
      )

      return overdueInstallments.sort((a, b) => b.daysOverdue - a.daysOverdue)

    } catch (error) {
      console.error('Get overdue installments error:', error)
      throw error
    }
  }

  // Send payment reminders
  static async sendPaymentReminders(
    reminderType: 'upcoming' | 'overdue' | 'grace_period',
    propertyId?: string
  ): Promise<{
    sent: number
    failed: number
    errors: string[]
  }> {
    try {
      await connectToDatabase()

      const query: any = {
        'partialPaymentPlans.status': 'active'
      }

      if (propertyId) {
        query.propertyId = propertyId
      }

      const bookings = await Booking.find(query)

      let sent = 0
      let failed = 0
      const errors: string[] = []

      const today = new Date()
      const reminderCutoffs = {
        upcoming: addDays(today, 2), // 2 days before due
        grace_period: addDays(today, -1), // 1 day after due
        overdue: addDays(today, -3) // 3 days after due
      }

      for (const booking of bookings) {
        for (const plan of booking.partialPaymentPlans || []) {
          if (plan.status !== 'active' || !plan.autoReminderEnabled) continue

          for (const installment of plan.installments) {
            let shouldSendReminder = false

            switch (reminderType) {
              case 'upcoming':
                shouldSendReminder = installment.status === 'pending' &&
                  isAfter(installment.dueDate, today) &&
                  isBefore(installment.dueDate, reminderCutoffs.upcoming)
                break

              case 'grace_period':
                shouldSendReminder = installment.status === 'pending' &&
                  isBefore(installment.dueDate, today) &&
                  isAfter(installment.dueDate, reminderCutoffs.grace_period)
                break

              case 'overdue':
                shouldSendReminder = installment.status === 'overdue' &&
                  isBefore(installment.dueDate, reminderCutoffs.overdue)
                break
            }

            if (shouldSendReminder) {
              try {
                const reminderSent = await this.sendInstallmentReminder(
                  booking,
                  plan,
                  installment,
                  reminderType
                )

                if (reminderSent) {
                  sent++
                  installment.remindersSent++
                  installment.lastReminderAt = new Date()
                } else {
                  failed++
                }
              } catch (error) {
                failed++
                errors.push(`Failed to send reminder for ${booking._id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }
          }
        }
      }

      // Save updated reminder counts
      await Promise.all(
        bookings.map(booking => booking.save())
      )

      return { sent, failed, errors }

    } catch (error) {
      console.error('Send payment reminders error:', error)
      throw error
    }
  }

  // Get partial payment statistics
  static async getPartialPaymentStatistics(
    propertyId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalPlans: number
    activePlans: number
    completedPlans: number
    defaultedPlans: number
    totalAmount: number
    collectedAmount: number
    outstandingAmount: number
    overdueAmount: number
    averageInstallments: number
    collectionRate: number
    defaultRate: number
  }> {
    try {
      await connectToDatabase()

      const query: any = {}
      if (propertyId) query.propertyId = propertyId
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = startDate
        if (endDate) query.createdAt.$lte = endDate
      }

      // Add filter for bookings with partial payment plans
      query['partialPaymentPlans.0'] = { $exists: true }

      const bookings = await Booking.find(query)

      let totalPlans = 0
      let activePlans = 0
      let completedPlans = 0
      let defaultedPlans = 0
      let totalAmount = 0
      let collectedAmount = 0
      let overdueAmount = 0
      let totalInstallments = 0

      bookings.forEach(booking => {
        booking.partialPaymentPlans?.forEach((plan: any) => {
          totalPlans++
          totalAmount += plan.totalAmount

          switch (plan.status) {
            case 'active':
              activePlans++
              break
            case 'completed':
              completedPlans++
              break
            case 'defaulted':
              defaultedPlans++
              break
          }

          totalInstallments += plan.installments.length

          plan.installments.forEach((installment: any) => {
            if (installment.status === 'paid') {
              collectedAmount += installment.amount
            } else if (installment.status === 'overdue') {
              overdueAmount += installment.amount
            }
          })
        })
      })

      const outstandingAmount = totalAmount - collectedAmount
      const averageInstallments = totalPlans > 0 ? totalInstallments / totalPlans : 0
      const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0
      const defaultRate = totalPlans > 0 ? (defaultedPlans / totalPlans) * 100 : 0

      return {
        totalPlans,
        activePlans,
        completedPlans,
        defaultedPlans,
        totalAmount,
        collectedAmount,
        outstandingAmount,
        overdueAmount,
        averageInstallments,
        collectionRate,
        defaultRate
      }

    } catch (error) {
      console.error('Partial payment statistics error:', error)
      throw error
    }
  }

  // Private helper methods
  private static async checkEligibility(booking: any): Promise<{ eligible: boolean; reason?: string }> {
    // Check if booking amount is above minimum threshold
    if ((booking.totalPrice || 0) < 5000) {
      return {
        eligible: false,
        reason: 'Booking amount is below minimum threshold for partial payments'
      }
    }

    // Check if booking is too close to check-in date
    const checkInDate = new Date(booking.dateFrom)
    const daysUntilCheckIn = differenceInDays(checkInDate, new Date())

    if (daysUntilCheckIn < 7) {
      return {
        eligible: false,
        reason: 'Booking is too close to check-in date for partial payment plan'
      }
    }

    // Check if already has a payment plan
    if (booking.partialPaymentPlans?.length > 0) {
      const activePlan = booking.partialPaymentPlans.find((plan: any) => plan.status === 'active')
      if (activePlan) {
        return {
          eligible: false,
          reason: 'Booking already has an active partial payment plan'
        }
      }
    }

    return { eligible: true }
  }

  private static async getTemplate(templateId: string): Promise<PartialPaymentTemplate | null> {
    // In production, this would fetch from database
    // For now, return a default template
    return {
      templateId,
      name: 'Standard 3-Month Plan',
      description: '3 equal installments over 3 months',
      applicableFor: {
        minimumAmount: 5000,
        bookingLeadTime: 30
      },
      installmentConfig: {
        numberOfInstallments: 3,
        schedule: [
          {
            installmentNumber: 1,
            percentage: 40,
            daysFromBooking: 0,
            description: 'Initial payment'
          },
          {
            installmentNumber: 2,
            percentage: 30,
            daysFromBooking: 30,
            description: 'Second installment'
          },
          {
            installmentNumber: 3,
            percentage: 30,
            daysFromBooking: 60,
            description: 'Final payment'
          }
        ]
      },
      terms: {
        lateFeePercentage: 2.5,
        gracePeriodDays: 3,
        cancellationPolicy: 'Standard policy applies',
        minimumInstallmentAmount: 1000
      },
      isActive: true,
      createdBy: 'system',
      createdAt: new Date()
    }
  }

  private static generateInstallmentsFromTemplate(booking: any, template: PartialPaymentTemplate): any[] {
    const totalAmount = booking.totalPrice || 0
    const bookingDate = new Date()

    return template.installmentConfig.schedule.map(scheduleItem => ({
      installmentNumber: scheduleItem.installmentNumber,
      amount: Math.round((totalAmount * scheduleItem.percentage) / 100),
      dueDate: addDays(bookingDate, scheduleItem.daysFromBooking),
      description: scheduleItem.description,
      status: 'pending',
      remindersSent: 0
    }))
  }

  private static generateDefaultInstallments(booking: any): any[] {
    const totalAmount = booking.totalPrice || 0
    const checkInDate = new Date(booking.dateFrom)
    const daysUntilCheckIn = differenceInDays(checkInDate, new Date())

    // Generate 3 installments with smart scheduling
    const installments = []

    // First installment: 40% due immediately
    installments.push({
      installmentNumber: 1,
      amount: Math.round(totalAmount * 0.4),
      dueDate: new Date(),
      description: 'Initial payment (40%)',
      status: 'pending',
      remindersSent: 0
    })

    // Second installment: 30% due in the middle
    const midDate = addDays(new Date(), Math.floor(daysUntilCheckIn / 2))
    installments.push({
      installmentNumber: 2,
      amount: Math.round(totalAmount * 0.3),
      dueDate: midDate,
      description: 'Second installment (30%)',
      status: 'pending',
      remindersSent: 0
    })

    // Final installment: 30% due 7 days before check-in
    const finalDate = addDays(checkInDate, -7)
    installments.push({
      installmentNumber: 3,
      amount: totalAmount - installments[0].amount - installments[1].amount, // Remaining amount
      dueDate: finalDate,
      description: 'Final payment (30%)',
      status: 'pending',
      remindersSent: 0
    })

    return installments
  }

  private static validateInstallments(installments: any[], totalAmount: number): { valid: boolean; error?: string } {
    if (installments.length === 0) {
      return { valid: false, error: 'No installments defined' }
    }

    const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0)

    if (Math.abs(totalInstallmentAmount - totalAmount) > 1) {
      return { valid: false, error: 'Installment amounts do not match total booking amount' }
    }

    // Check minimum amounts
    const hasInvalidAmount = installments.some(inst => inst.amount < 500)
    if (hasInvalidAmount) {
      return { valid: false, error: 'Installment amount cannot be less than ₹500' }
    }

    // Check date order
    for (let i = 1; i < installments.length; i++) {
      if (isBefore(installments[i].dueDate, installments[i - 1].dueDate)) {
        return { valid: false, error: 'Installment due dates must be in chronological order' }
      }
    }

    return { valid: true }
  }

  private static getNextInstallment(plan: any): any {
    return plan.installments.find((inst: any) => inst.status === 'pending')
  }

  private static async sendInstallmentReminder(
    booking: any,
    plan: any,
    installment: any,
    reminderType: string
  ): Promise<boolean> {
    // In production, this would integrate with email/SMS service
    console.log(`Sending ${reminderType} reminder for installment ${installment.installmentNumber}`, {
      bookingId: booking._id.toString(),
      planId: plan.planId,
      amount: installment.amount,
      dueDate: installment.dueDate,
      guestEmail: booking.contactDetails?.email || booking.email
    })

    // Simulate successful sending
    return true
  }
}