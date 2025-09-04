import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventBooking from "@/models/EventBooking"
import EventVenue from "@/models/EventVenue"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get detailed event booking status
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { bookingId: string } }) => {
  try {
    await connectMongo()
    const { bookingId } = params

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      )
    }

    const booking = await EventBooking.findById(bookingId)
      .populate('venueId', 'name capacity pricing availability')
      .populate('services.serviceId', 'serviceName category pricing')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      )
    }

    // Calculate event timing details
    const eventDate = new Date(booking.eventDate)
    const currentDate = new Date()
    const eventStartDateTime = new Date(`${booking.eventDate}T${booking.startTime}:00`)
    const eventEndDateTime = new Date(`${booking.eventDate}T${booking.endTime}:00`)
    
    const daysUntilEvent = Math.ceil((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    const hoursUntilEvent = Math.ceil((eventStartDateTime.getTime() - currentDate.getTime()) / (1000 * 60 * 60))
    const minutesUntilEvent = Math.ceil((eventStartDateTime.getTime() - currentDate.getTime()) / (1000 * 60))

    // Determine current phase of the event
    let currentPhase = 'planning'
    let phaseDescription = 'Event is in planning phase'
    
    if (currentDate < eventStartDateTime) {
      if (daysUntilEvent <= 1) {
        currentPhase = 'preparation'
        phaseDescription = 'Event is in final preparation phase'
      } else if (daysUntilEvent <= 7) {
        currentPhase = 'pre_event'
        phaseDescription = 'Event is approaching - final preparations underway'
      } else {
        currentPhase = 'planning'
        phaseDescription = 'Event is in planning and coordination phase'
      }
    } else if (currentDate >= eventStartDateTime && currentDate <= eventEndDateTime) {
      currentPhase = 'live'
      phaseDescription = 'Event is currently live and in progress'
    } else if (currentDate > eventEndDateTime) {
      if ((currentDate.getTime() - eventEndDateTime.getTime()) < (2 * 60 * 60 * 1000)) { // within 2 hours
        currentPhase = 'cleanup'
        phaseDescription = 'Event has ended - cleanup in progress'
      } else {
        currentPhase = 'completed'
        phaseDescription = 'Event has been completed'
      }
    }

    // Calculate completion percentage
    const timeline = booking.eventTimeline || []
    const completedStages = timeline.filter((stage: any) => stage.status === 'completed').length
    const totalStages = timeline.length || 10 // Default expected stages
    const completionPercentage = Math.round((completedStages / totalStages) * 100)

    // Check for any issues or alerts
    const alerts = []
    const issues = []

    // Payment alerts
    if (booking.paymentStatus === 'pending') {
      alerts.push({
        type: 'payment',
        severity: daysUntilEvent <= 2 ? 'critical' : 'high',
        message: `Advance payment of ₹${booking.advancePayment} is still pending`,
        actionRequired: 'Contact client for payment'
      })
    }

    if (booking.paymentStatus === 'partial' && daysUntilEvent <= 1) {
      alerts.push({
        type: 'payment',
        severity: 'critical',
        message: `Final payment of ₹${booking.balanceAmount} is due`,
        actionRequired: 'Collect final payment before event'
      })
    }

    // Timeline alerts
    const overdueStages = timeline.filter((stage: any) => 
      stage.status !== 'completed' && 
      new Date(stage.scheduledTime) < currentDate &&
      stage.priority === 'critical'
    )

    overdueStages.forEach((stage: any) => {
      alerts.push({
        type: 'timeline',
        severity: 'high',
        message: `Critical stage "${stage.title}" is overdue`,
        actionRequired: `Complete ${stage.title} immediately`
      })
    })

    // Venue availability check
    if (booking.venueId && daysUntilEvent <= 7) {
      // Check for conflicting bookings (simplified check)
      const conflictingBookings = await EventBooking.find({
        venueId: booking.venueId._id,
        eventDate: booking.eventDate,
        status: { $nin: ['cancelled', 'completed'] },
        _id: { $ne: booking._id },
        $or: [
          {
            startTime: { $lte: booking.startTime },
            endTime: { $gt: booking.startTime }
          },
          {
            startTime: { $lt: booking.endTime },
            endTime: { $gte: booking.endTime }
          }
        ]
      }).lean() as any[]

      if (conflictingBookings.length > 0) {
        issues.push({
          type: 'venue_conflict',
          severity: 'critical',
          message: 'Venue booking conflict detected',
          details: `Conflicting with ${conflictingBookings.length} other booking(s)`,
          actionRequired: 'Resolve venue scheduling conflict immediately'
        })
      }
    }

    // Service readiness check
    const incompleteServices = (booking.services || []).filter((service: any) => 
      !service.confirmed || service.status !== 'ready'
    )

    if (incompleteServices.length > 0 && daysUntilEvent <= 3) {
      alerts.push({
        type: 'services',
        severity: 'medium',
        message: `${incompleteServices.length} service(s) not confirmed`,
        actionRequired: 'Confirm all service providers'
      })
    }

    // Generate status summary
    const statusSummary = {
      overall: booking.status,
      phase: currentPhase,
      phaseDescription,
      completion: completionPercentage,
      timeline: {
        daysUntilEvent: Math.max(0, daysUntilEvent),
        hoursUntilEvent: Math.max(0, hoursUntilEvent),
        minutesUntilEvent: Math.max(0, minutesUntilEvent),
        isToday: daysUntilEvent === 0,
        isLive: currentPhase === 'live',
        isPastEvent: currentDate > eventEndDateTime
      },
      readiness: {
        venue: booking.venueId ? 'confirmed' : 'pending',
        payment: booking.paymentStatus,
        services: incompleteServices.length === 0 ? 'ready' : 'pending',
        timeline: overdueStages.length === 0 ? 'on_track' : 'delayed'
      },
      healthScore: Math.max(0, 100 - (alerts.length * 10) - (issues.length * 20)), // Simple health scoring
      riskLevel: issues.length > 0 ? 'high' : alerts.filter(a => a.severity === 'critical').length > 0 ? 'medium' : 'low'
    }

    // Next actions required
    const nextActions = []
    
    if (booking.status === 'pending') {
      nextActions.push({
        action: 'confirm_booking',
        title: 'Confirm Booking',
        description: 'Review and confirm the event booking',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due tomorrow
      })
    }

    if (booking.paymentStatus === 'pending') {
      nextActions.push({
        action: 'collect_advance',
        title: 'Collect Advance Payment',
        description: `Collect advance payment of ₹${booking.advancePayment}`,
        priority: daysUntilEvent <= 2 ? 'critical' : 'high',
        dueDate: new Date(eventStartDateTime.getTime() - 48 * 60 * 60 * 1000) // 2 days before event
      })
    }

    if (booking.paymentStatus === 'partial') {
      nextActions.push({
        action: 'collect_balance',
        title: 'Collect Balance Payment',
        description: `Collect balance payment of ₹${booking.balanceAmount}`,
        priority: 'critical',
        dueDate: new Date(eventStartDateTime.getTime() - 24 * 60 * 60 * 1000) // 1 day before event
      })
    }

    // Get upcoming milestones
    const upcomingMilestones = timeline
      .filter((stage: any) => 
        stage.status !== 'completed' && 
        new Date(stage.scheduledTime) >= currentDate
      )
      .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        eventName: booking.eventName,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        expectedGuests: booking.expectedGuests,
        venue: booking.venueId ? {
          id: booking.venueId._id.toString(),
          name: booking.venueId.name,
          capacity: booking.venueId.capacity
        } : null,
        organizer: booking.organizer,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      },
      statusSummary,
      alerts,
      issues,
      nextActions,
      upcomingMilestones: upcomingMilestones.map((milestone: any) => ({
        stage: milestone.stage,
        title: milestone.title,
        scheduledTime: milestone.scheduledTime,
        priority: milestone.priority,
        status: milestone.status
      })),
      pricing: {
        totalAmount: booking.totalAmount,
        advancePayment: booking.advancePayment,
        balanceAmount: booking.balanceAmount,
        paymentStatus: booking.paymentStatus
      },
      lastUpdated: booking.updatedAt
    })

  } catch (error) {
    console.error('Error fetching event status:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event status" },
      { status: 500 }
    )
  }
})

// PUT handler - Update event booking status
export const PUT = dbHandler(async (req: NextRequest, { params }: { params: { bookingId: string } }) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()
    const { bookingId } = params

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    try {
      const validatedData = updateStatusSchema.parse(body)

      const booking = await EventBooking.findById(bookingId)
      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        )
      }

      // Validate status transition
      const validTransitions: { [key: string]: string[] } = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [], // No transitions from completed
        'cancelled': ['pending'] // Can reactivate cancelled bookings
      }

      const currentStatus = booking.status
      if (!validTransitions[currentStatus]?.includes(validatedData.status) && validatedData.status !== currentStatus) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Invalid status transition from '${currentStatus}' to '${validatedData.status}'` 
          },
          { status: 400 }
        )
      }

      // Prepare update object
      const updateData: any = {
        status: validatedData.status,
        lastUpdatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }

      // Add status-specific updates
      if (validatedData.notes) {
        updateData.statusNotes = validatedData.notes
      }

      // Update timeline based on status change
      const timeline = booking.eventTimeline || []
      const now = new Date()

      switch (validatedData.status) {
        case 'confirmed':
          // Update booking_confirmed timeline stage
          const confirmStageIndex = timeline.findIndex((stage: any) => stage.stage === 'booking_confirmed')
          if (confirmStageIndex >= 0) {
            timeline[confirmStageIndex].status = 'completed'
            timeline[confirmStageIndex].actualTime = now
            timeline[confirmStageIndex].notes = validatedData.notes || 'Booking confirmed'
          } else {
            timeline.push({
              stage: 'booking_confirmed',
              title: 'Booking Confirmed',
              status: 'completed',
              actualTime: now,
              notes: validatedData.notes || 'Booking confirmed'
            })
          }
          break

        case 'completed':
          // Update event_completed timeline stage
          const completedStageIndex = timeline.findIndex((stage: any) => stage.stage === 'event_completed')
          if (completedStageIndex >= 0) {
            timeline[completedStageIndex].status = 'completed'
            timeline[completedStageIndex].actualTime = now
            timeline[completedStageIndex].notes = validatedData.notes || 'Event completed successfully'
          } else {
            timeline.push({
              stage: 'event_completed',
              title: 'Event Completed',
              status: 'completed',
              actualTime: now,
              notes: validatedData.notes || 'Event completed successfully'
            })
          }
          break

        case 'cancelled':
          // Add cancellation to timeline
          timeline.push({
            stage: 'booking_cancelled',
            title: 'Booking Cancelled',
            status: 'completed',
            actualTime: now,
            notes: validatedData.notes || 'Booking cancelled',
            priority: 'high'
          })
          break
      }

      updateData.eventTimeline = timeline

      // Update the booking
      const updatedBooking = await EventBooking.findByIdAndUpdate(
        bookingId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      // Log the status change for audit trail
      const statusChange = {
        from: currentStatus,
        to: validatedData.status,
        changedBy: token.sub,
        changedAt: now,
        notes: validatedData.notes || ''
      }

      return NextResponse.json({
        success: true,
        message: `Booking status updated from '${currentStatus}' to '${validatedData.status}' successfully`,
        booking: {
          id: updatedBooking!._id.toString(),
          bookingNumber: updatedBooking!.bookingNumber,
          status: updatedBooking!.status,
          updatedAt: updatedBooking!.updatedAt,
          lastUpdatedBy: updatedBooking!.lastUpdatedBy
        },
        statusChange,
        nextAvailableActions: validTransitions[validatedData.status] || []
      })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error updating event status:', error)

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
      return NextResponse.json(
        { 
          success: false, 
          message: "Database validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Failed to update event status" },
      { status: 500 }
    )
  }
})

// Schema for status update
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional()
})