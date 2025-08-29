/**
 * Automated Booking Management System
 * Handles automatic status transitions, reminders, and smart booking rules
 */

import Booking from "@/models/Booking"
import User from "@/models/User"
import Property from "@/models/Property"
import { sendReactEmail } from "./email"
import dbConnect from "@/lib/db/dbConnect"

export interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: 'time_based' | 'status_change' | 'payment_received' | 'check_in_date'
  conditions: {
    status?: string[]
    timeBeforeEvent?: number // minutes
    timeAfterEvent?: number // minutes
    paymentStatus?: string
    propertyType?: string[]
  }
  actions: {
    updateStatus?: string
    sendEmail?: {
      template: string
      recipient: 'guest' | 'admin' | 'property_owner'
    }
    createTask?: {
      title: string
      description: string
      assignTo: 'admin' | 'property_owner'
      priority: 'low' | 'medium' | 'high'
    }
    updateNotes?: string
  }
  enabled: boolean
  createdAt: Date
  lastRun?: Date
}

class AutomatedBookingManager {
  private static instance: AutomatedBookingManager
  private rules: AutomationRule[] = []
  private isRunning = false

  private constructor() {
    this.initializeDefaultRules()
  }

  static getInstance(): AutomatedBookingManager {
    if (!AutomatedBookingManager.instance) {
      AutomatedBookingManager.instance = new AutomatedBookingManager()
    }
    return AutomatedBookingManager.instance
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'auto_confirm_payment',
        name: 'Auto-confirm on Payment',
        description: 'Automatically confirm bookings when payment is received',
        trigger: 'payment_received',
        conditions: {
          status: ['pending'],
          paymentStatus: 'completed'
        },
        actions: {
          updateStatus: 'confirmed',
          sendEmail: {
            template: 'booking-confirmed',
            recipient: 'guest'
          },
          updateNotes: 'Auto-confirmed on payment receipt'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'reminder_24h_before',
        name: '24-Hour Check-in Reminder',
        description: 'Send reminder email 24 hours before check-in',
        trigger: 'check_in_date',
        conditions: {
          status: ['confirmed'],
          timeBeforeEvent: 24 * 60 // 24 hours in minutes
        },
        actions: {
          sendEmail: {
            template: 'check-in-reminder',
            recipient: 'guest'
          }
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'auto_complete_checkout',
        name: 'Auto-complete on Check-out',
        description: 'Automatically complete bookings 2 hours after checkout time',
        trigger: 'check_in_date',
        conditions: {
          status: ['confirmed'],
          timeAfterEvent: 2 * 60 // 2 hours after checkout
        },
        actions: {
          updateStatus: 'completed',
          sendEmail: {
            template: 'booking-completed-feedback',
            recipient: 'guest'
          },
          updateNotes: 'Auto-completed after checkout time'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'cancel_unpaid_bookings',
        name: 'Cancel Unpaid Bookings',
        description: 'Cancel bookings that remain unpaid 24 hours after creation',
        trigger: 'time_based',
        conditions: {
          status: ['pending'],
          paymentStatus: 'pending',
          timeAfterEvent: 24 * 60 // 24 hours after creation
        },
        actions: {
          updateStatus: 'cancelled',
          sendEmail: {
            template: 'booking-cancelled-unpaid',
            recipient: 'guest'
          },
          updateNotes: 'Auto-cancelled due to non-payment'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'follow_up_completed',
        name: 'Post-stay Follow-up',
        description: 'Send follow-up email 24 hours after checkout for feedback',
        trigger: 'check_in_date',
        conditions: {
          status: ['completed'],
          timeAfterEvent: 24 * 60 // 24 hours after checkout
        },
        actions: {
          sendEmail: {
            template: 'post-stay-feedback',
            recipient: 'guest'
          }
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'overdue_checkin_alert',
        name: 'Overdue Check-in Alert',
        description: 'Alert admin when guests are 2 hours late for check-in',
        trigger: 'check_in_date',
        conditions: {
          status: ['confirmed'],
          timeAfterEvent: 2 * 60 // 2 hours after check-in time
        },
        actions: {
          sendEmail: {
            template: 'overdue-checkin-alert',
            recipient: 'admin'
          },
          createTask: {
            title: 'Overdue Check-in',
            description: 'Guest has not checked in 2+ hours after scheduled time',
            assignTo: 'admin',
            priority: 'high'
          }
        },
        enabled: true,
        createdAt: new Date()
      }
    ]
  }

  /**
   * Start the automation engine
   */
  async start() {
    if (this.isRunning) {
      console.log('🤖 [AutomatedBookingManager] Already running')
      return
    }

    console.log('🤖 [AutomatedBookingManager] Starting automation engine...')
    this.isRunning = true

    // Run immediately, then every 5 minutes
    await this.runAutomationCycle()
    
    setInterval(async () => {
      if (this.isRunning) {
        await this.runAutomationCycle()
      }
    }, 5 * 60 * 1000) // 5 minutes

    console.log('🤖 [AutomatedBookingManager] Automation engine started')
  }

  /**
   * Stop the automation engine
   */
  stop() {
    this.isRunning = false
    console.log('🤖 [AutomatedBookingManager] Automation engine stopped')
  }

  /**
   * Run a complete automation cycle
   */
  private async runAutomationCycle() {
    if (!this.isRunning) return

    try {
      console.log('🔄 [AutomatedBookingManager] Running automation cycle...')
      await dbConnect()

      for (const rule of this.rules.filter(r => r.enabled)) {
        try {
          await this.executeRule(rule)
          rule.lastRun = new Date()
        } catch (error) {
          console.error(`❌ [AutomatedBookingManager] Error executing rule ${rule.id}:`, error)
        }
      }

      console.log('✅ [AutomatedBookingManager] Automation cycle completed')
    } catch (error) {
      console.error('💥 [AutomatedBookingManager] Error in automation cycle:', error)
    }
  }

  /**
   * Execute a specific automation rule
   */
  private async executeRule(rule: AutomationRule) {
    console.log(`🔧 [AutomatedBookingManager] Executing rule: ${rule.name}`)

    let matchingBookings: any[] = []

    switch (rule.trigger) {
      case 'time_based':
        matchingBookings = await this.findTimeBasedMatches(rule)
        break
      case 'payment_received':
        matchingBookings = await this.findPaymentMatches(rule)
        break
      case 'check_in_date':
        matchingBookings = await this.findCheckInMatches(rule)
        break
      case 'status_change':
        // This would be handled by webhook/event system
        break
    }

    console.log(`🎯 [AutomatedBookingManager] Found ${matchingBookings.length} matching bookings for rule ${rule.id}`)

    for (const booking of matchingBookings) {
      await this.executeRuleActions(rule, booking)
    }
  }

  /**
   * Find bookings that match time-based conditions
   */
  private async findTimeBasedMatches(rule: AutomationRule): Promise<any[]> {
    const now = new Date()
    const conditions: any = {}

    if (rule.conditions.status) {
      conditions.status = { $in: rule.conditions.status }
    }

    if (rule.conditions.paymentStatus) {
      conditions.paymentStatus = rule.conditions.paymentStatus
    }

    if (rule.conditions.timeAfterEvent) {
      const timeThreshold = new Date(now.getTime() - rule.conditions.timeAfterEvent * 60 * 1000)
      conditions.createdAt = { $lte: timeThreshold }
    }

    return await Booking.find(conditions)
      .populate('userId', 'name email')
      .populate('propertyId', 'title address ownerId')
      .lean()
  }

  /**
   * Find bookings that match payment conditions
   */
  private async findPaymentMatches(rule: AutomationRule): Promise<any[]> {
    const conditions: any = {}

    if (rule.conditions.status) {
      conditions.status = { $in: rule.conditions.status }
    }

    if (rule.conditions.paymentStatus) {
      conditions.paymentStatus = rule.conditions.paymentStatus
    }

    // Only look at recently updated bookings for payment triggers
    const recentTime = new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
    conditions.updatedAt = { $gte: recentTime }

    return await Booking.find(conditions)
      .populate('userId', 'name email')
      .populate('propertyId', 'title address ownerId')
      .lean()
  }

  /**
   * Find bookings that match check-in date conditions
   */
  private async findCheckInMatches(rule: AutomationRule): Promise<any[]> {
    const now = new Date()
    const conditions: any = {}

    if (rule.conditions.status) {
      conditions.status = { $in: rule.conditions.status }
    }

    if (rule.conditions.timeBeforeEvent) {
      const beforeTime = new Date(now.getTime() + rule.conditions.timeBeforeEvent * 60 * 1000)
      const afterTime = new Date(now.getTime() + (rule.conditions.timeBeforeEvent - 5) * 60 * 1000)
      
      conditions.dateFrom = {
        $gte: afterTime,
        $lte: beforeTime
      }
    }

    if (rule.conditions.timeAfterEvent) {
      let timeField = 'dateFrom' // Default to check-in time
      
      // For completed bookings, use checkout time
      if (rule.conditions.status?.includes('completed')) {
        timeField = 'dateTo'
      }
      
      const timeThreshold = new Date(now.getTime() - rule.conditions.timeAfterEvent * 60 * 1000)
      conditions[timeField] = { $lte: timeThreshold }
    }

    return await Booking.find(conditions)
      .populate('userId', 'name email')
      .populate('propertyId', 'title address ownerId')
      .lean()
  }

  /**
   * Execute the actions defined in a rule
   */
  private async executeRuleActions(rule: AutomationRule, booking: any) {
    try {
      console.log(`⚡ [AutomatedBookingManager] Executing actions for booking ${booking._id}`)

      // Update status
      if (rule.actions.updateStatus) {
        await Booking.findByIdAndUpdate(booking._id, {
          status: rule.actions.updateStatus,
          ...(rule.actions.updateNotes && { 
            adminNotes: `${booking.adminNotes || ''}\n${rule.actions.updateNotes}`.trim()
          }),
          updatedAt: new Date()
        })
        console.log(`📝 [AutomatedBookingManager] Updated booking ${booking._id} status to ${rule.actions.updateStatus}`)
      }

      // Send email
      if (rule.actions.sendEmail && booking.userId?.email) {
        try {
          await sendReactEmail({
            to: booking.userId.email,
            subject: this.getEmailSubject(rule.actions.sendEmail.template),
            template: rule.actions.sendEmail.template,
            data: {
              booking,
              guest: booking.userId,
              property: booking.propertyId,
              automationRule: rule.name
            }
          })
          console.log(`📧 [AutomatedBookingManager] Sent email ${rule.actions.sendEmail.template} to ${booking.userId.email}`)
        } catch (emailError) {
          console.error(`📧 [AutomatedBookingManager] Failed to send email:`, emailError)
        }
      }

      // Create task (simplified - in a real system, you'd save to a tasks collection)
      if (rule.actions.createTask) {
        console.log(`📋 [AutomatedBookingManager] Task created: ${rule.actions.createTask.title}`)
        // This would typically save to a tasks/tickets system
      }

    } catch (error) {
      console.error(`❌ [AutomatedBookingManager] Error executing actions for booking ${booking._id}:`, error)
    }
  }

  /**
   * Get email subject based on template
   */
  private getEmailSubject(template: string): string {
    const subjects: Record<string, string> = {
      'booking-confirmed': 'Booking Confirmation',
      'check-in-reminder': 'Check-in Reminder - 24 Hours to Go!',
      'booking-completed-feedback': 'How was your stay? Share your feedback',
      'booking-cancelled-unpaid': 'Booking Cancelled - Payment Not Received',
      'post-stay-feedback': 'Thank you for staying with us!',
      'overdue-checkin-alert': 'Alert: Overdue Check-in'
    }
    return subjects[template] || 'Booking Update'
  }

  /**
   * Add a custom automation rule
   */
  addRule(rule: Omit<AutomationRule, 'id' | 'createdAt'>) {
    const newRule: AutomationRule = {
      ...rule,
      id: `custom_${Date.now()}`,
      createdAt: new Date()
    }
    this.rules.push(newRule)
    console.log(`➕ [AutomatedBookingManager] Added custom rule: ${newRule.name}`)
  }

  /**
   * Enable or disable a rule
   */
  toggleRule(ruleId: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = enabled
      console.log(`🔧 [AutomatedBookingManager] Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Get all rules
   */
  getRules(): AutomationRule[] {
    return [...this.rules]
  }

  /**
   * Get automation statistics
   */
  async getStats() {
    await dbConnect()
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const stats = {
      totalRules: this.rules.length,
      enabledRules: this.rules.filter(r => r.enabled).length,
      todayActions: {
        autoConfirmed: await Booking.countDocuments({
          status: 'confirmed',
          adminNotes: { $regex: 'Auto-confirmed' },
          updatedAt: { $gte: today }
        }),
        autoCancelled: await Booking.countDocuments({
          status: 'cancelled',
          adminNotes: { $regex: 'Auto-cancelled' },
          updatedAt: { $gte: today }
        }),
        autoCompleted: await Booking.countDocuments({
          status: 'completed',
          adminNotes: { $regex: 'Auto-completed' },
          updatedAt: { $gte: today }
        })
      },
      upcomingActions: {
        reminders24h: await Booking.countDocuments({
          status: 'confirmed',
          dateFrom: {
            $gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
            $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
          }
        }),
        pendingCancellations: await Booking.countDocuments({
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: { $lte: new Date(now.getTime() - 20 * 60 * 60 * 1000) } // 20+ hours old
        })
      }
    }

    return stats
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualTrigger(ruleId: string, bookingId?: string) {
    console.log(`🔧 [AutomatedBookingManager] Manual trigger for rule ${ruleId}`)
    
    const rule = this.rules.find(r => r.id === ruleId)
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`)
    }

    if (bookingId) {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('propertyId', 'title address ownerId')
        .lean()
      
      if (booking) {
        await this.executeRuleActions(rule, booking)
      }
    } else {
      await this.executeRule(rule)
    }
  }
}

// Export singleton instance
export const automatedBookingManager = AutomatedBookingManager.getInstance()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  automatedBookingManager.start()
}

export default AutomatedBookingManager