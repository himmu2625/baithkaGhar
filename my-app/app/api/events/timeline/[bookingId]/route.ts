import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventBooking from "@/models/EventBooking"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get event timeline for a booking
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
      .populate('venueId', 'name')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      )
    }

    // Generate comprehensive timeline with automatic milestones
    const eventDate = new Date(booking.eventDate)
    const currentDate = new Date()
    const daysUntilEvent = Math.ceil((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    // Default timeline stages with auto-calculated dates
    const defaultTimeline = [
      {
        stage: 'booking_created',
        title: 'Booking Created',
        description: 'Event booking has been created and is pending confirmation',
        scheduledTime: booking.createdAt,
        actualTime: booking.createdAt,
        status: 'completed',
        isAutomatic: true,
        priority: 'low',
        assignedTo: booking.createdBy,
        notes: 'Event booking created successfully'
      },
      {
        stage: 'booking_confirmed',
        title: 'Booking Confirmed',
        description: 'Event booking has been confirmed by management',
        scheduledTime: new Date(booking.createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 day
        actualTime: booking.status === 'confirmed' ? new Date() : null,
        status: booking.status === 'confirmed' ? 'completed' : 'pending',
        isAutomatic: false,
        priority: 'high',
        assignedTo: null,
        notes: 'Awaiting management confirmation'
      },
      {
        stage: 'advance_payment',
        title: 'Advance Payment',
        description: 'Advance payment received from client',
        scheduledTime: new Date(booking.createdAt.getTime() + 48 * 60 * 60 * 1000), // +2 days
        actualTime: booking.paymentStatus === 'partial' ? new Date() : null,
        status: booking.paymentStatus === 'partial' || booking.paymentStatus === 'paid' ? 'completed' : 'pending',
        isAutomatic: false,
        priority: 'high',
        assignedTo: null,
        notes: `Expected amount: ₹${booking.advancePayment || 0}`
      },
      {
        stage: 'final_planning',
        title: 'Final Planning Meeting',
        description: 'Final planning and coordination meeting with client',
        scheduledTime: new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000), // -7 days
        actualTime: null,
        status: daysUntilEvent <= 7 ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'medium',
        assignedTo: null,
        notes: 'Coordinate final details with client'
      },
      {
        stage: 'setup_preparation',
        title: 'Setup Preparation',
        description: 'Preparation of venue setup and decoration materials',
        scheduledTime: new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000), // -3 days
        actualTime: null,
        status: daysUntilEvent <= 3 ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'medium',
        assignedTo: null,
        notes: 'Prepare all setup materials and decorations'
      },
      {
        stage: 'vendor_coordination',
        title: 'Vendor Coordination',
        description: 'Coordinate with all vendors and service providers',
        scheduledTime: new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days
        actualTime: null,
        status: daysUntilEvent <= 2 ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'high',
        assignedTo: null,
        notes: 'Confirm timing with all vendors'
      },
      {
        stage: 'final_payment',
        title: 'Final Payment',
        description: 'Final payment due before event',
        scheduledTime: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000), // -1 day
        actualTime: booking.paymentStatus === 'paid' ? new Date() : null,
        status: booking.paymentStatus === 'paid' ? 'completed' : 'pending',
        isAutomatic: false,
        priority: 'critical',
        assignedTo: null,
        notes: `Balance amount: ₹${booking.balanceAmount || 0}`
      },
      {
        stage: 'day_before_prep',
        title: 'Day Before Preparation',
        description: 'Final preparations and setup begins',
        scheduledTime: new Date(eventDate.getTime() - 12 * 60 * 60 * 1000), // -12 hours
        actualTime: null,
        status: daysUntilEvent <= 0.5 ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'high',
        assignedTo: null,
        notes: 'Begin venue setup and decoration'
      },
      {
        stage: 'event_setup',
        title: 'Event Setup',
        description: 'Complete venue setup and final preparations',
        scheduledTime: new Date(eventDate.getTime() - 4 * 60 * 60 * 1000), // -4 hours before event
        actualTime: null,
        status: new Date() >= new Date(eventDate.getTime() - 4 * 60 * 60 * 1000) ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'critical',
        assignedTo: null,
        notes: 'Complete setup 4 hours before event start'
      },
      {
        stage: 'event_start',
        title: 'Event Begins',
        description: 'Event officially starts',
        scheduledTime: new Date(`${booking.eventDate}T${booking.startTime}:00`),
        actualTime: null,
        status: new Date() >= new Date(`${booking.eventDate}T${booking.startTime}:00`) ? 'in_progress' : 'scheduled',
        isAutomatic: true,
        priority: 'critical',
        assignedTo: null,
        notes: `Event starts at ${booking.startTime}`
      },
      {
        stage: 'event_end',
        title: 'Event Ends',
        description: 'Event officially ends',
        scheduledTime: new Date(`${booking.eventDate}T${booking.endTime}:00`),
        actualTime: null,
        status: new Date() > new Date(`${booking.eventDate}T${booking.endTime}:00`) ? 'completed' : 'scheduled',
        isAutomatic: true,
        priority: 'medium',
        assignedTo: null,
        notes: `Event ends at ${booking.endTime}`
      },
      {
        stage: 'cleanup',
        title: 'Cleanup & Breakdown',
        description: 'Post-event cleanup and equipment breakdown',
        scheduledTime: new Date(new Date(`${booking.eventDate}T${booking.endTime}:00`).getTime() + 60 * 60 * 1000), // +1 hour after event
        actualTime: null,
        status: new Date() > new Date(`${booking.eventDate}T${booking.endTime}:00`) ? 'in_progress' : 'scheduled',
        isAutomatic: false,
        priority: 'medium',
        assignedTo: null,
        notes: 'Complete breakdown and cleanup'
      },
      {
        stage: 'event_completed',
        title: 'Event Completed',
        description: 'Event successfully completed',
        scheduledTime: new Date(new Date(`${booking.eventDate}T${booking.endTime}:00`).getTime() + 2 * 60 * 60 * 1000), // +2 hours after event
        actualTime: booking.status === 'completed' ? new Date() : null,
        status: booking.status === 'completed' ? 'completed' : 'scheduled',
        isAutomatic: false,
        priority: 'low',
        assignedTo: null,
        notes: 'Event successfully completed'
      }
    ]

    // Merge with existing timeline from booking
    const existingTimeline = booking.eventTimeline || []
    const mergedTimeline = defaultTimeline.map(defaultItem => {
      const existingItem = existingTimeline.find((item: any) => item.stage === defaultItem.stage)
      return existingItem ? { ...defaultItem, ...existingItem } : defaultItem
    })

    // Add any custom timeline items that don't match default stages
    const customItems = existingTimeline.filter((item: any) => 
      !defaultTimeline.some(defaultItem => defaultItem.stage === item.stage)
    )
    
    const fullTimeline = [...mergedTimeline, ...customItems].sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    )

    // Calculate timeline statistics
    const timelineStats = {
      totalStages: fullTimeline.length,
      completed: fullTimeline.filter(item => item.status === 'completed').length,
      inProgress: fullTimeline.filter(item => item.status === 'in_progress').length,
      pending: fullTimeline.filter(item => item.status === 'pending' || item.status === 'scheduled').length,
      overdue: fullTimeline.filter(item => 
        item.status !== 'completed' && 
        new Date(item.scheduledTime) < new Date() &&
        item.priority === 'critical'
      ).length,
      completionPercentage: Math.round((fullTimeline.filter(item => item.status === 'completed').length / fullTimeline.length) * 100),
      nextMilestone: fullTimeline.find(item => 
        item.status !== 'completed' && new Date(item.scheduledTime) >= new Date()
      )
    }

    // Get recent activity (last 10 timeline updates)
    const recentActivity = fullTimeline
      .filter(item => item.actualTime)
      .sort((a, b) => new Date(b.actualTime!).getTime() - new Date(a.actualTime!).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        eventName: booking.eventName,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        venue: booking.venueId
      },
      timeline: fullTimeline.map(item => ({
        ...item,
        id: item.stage,
        scheduledTime: item.scheduledTime,
        actualTime: item.actualTime,
        assignedTo: item.assignedTo ? {
          id: item.assignedTo._id?.toString(),
          name: item.assignedTo.name,
          email: item.assignedTo.email
        } : null
      })),
      statistics: timelineStats,
      recentActivity,
      daysUntilEvent: daysUntilEvent > 0 ? daysUntilEvent : 0,
      isEventDay: daysUntilEvent === 0,
      isEventPassed: daysUntilEvent < 0
    })

  } catch (error) {
    console.error('Error fetching event timeline:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event timeline" },
      { status: 500 }
    )
  }
})

// PUT handler - Update timeline stage
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
      const validatedData = updateTimelineSchema.parse(body)

      const booking = await EventBooking.findById(bookingId)
      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        )
      }

      // Find existing timeline item or create new one
      const existingTimeline = booking.eventTimeline || []
      const stageIndex = existingTimeline.findIndex((item: any) => item.stage === validatedData.stage)

      const timelineUpdate = {
        stage: validatedData.stage,
        title: validatedData.title,
        description: validatedData.description,
        scheduledTime: validatedData.scheduledTime ? new Date(validatedData.scheduledTime) : new Date(),
        actualTime: validatedData.status === 'completed' ? new Date() : validatedData.actualTime ? new Date(validatedData.actualTime) : null,
        status: validatedData.status,
        priority: validatedData.priority || 'medium',
        assignedTo: validatedData.assignedTo ? new Types.ObjectId(validatedData.assignedTo) : null,
        notes: validatedData.notes || '',
        updatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }

      let updatedTimeline
      if (stageIndex >= 0) {
        // Update existing stage
        updatedTimeline = [...existingTimeline]
        updatedTimeline[stageIndex] = { ...updatedTimeline[stageIndex], ...timelineUpdate }
      } else {
        // Add new stage
        updatedTimeline = [...existingTimeline, timelineUpdate]
      }

      // Update booking status based on timeline progress
      let bookingStatus = booking.status
      if (validatedData.stage === 'booking_confirmed' && validatedData.status === 'completed') {
        bookingStatus = 'confirmed'
      } else if (validatedData.stage === 'event_completed' && validatedData.status === 'completed') {
        bookingStatus = 'completed'
      }

      const updatedBooking = await EventBooking.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            eventTimeline: updatedTimeline,
            status: bookingStatus,
            lastUpdatedBy: new Types.ObjectId(token.sub),
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      )
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      return NextResponse.json({
        success: true,
        message: "Timeline updated successfully",
        timelineStage: {
          ...timelineUpdate,
          id: timelineUpdate.stage
        },
        booking: {
          id: updatedBooking!._id.toString(),
          status: updatedBooking!.status,
          updatedAt: updatedBooking!.updatedAt,
          lastUpdatedBy: updatedBooking!.lastUpdatedBy
        }
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
    console.error('Error updating timeline:', error)
    return NextResponse.json(
      { success: false, message: "Failed to update timeline" },
      { status: 500 }
    )
  }
})

// Schema for timeline update
const updateTimelineSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  status: z.enum(['scheduled', 'pending', 'in_progress', 'completed', 'cancelled', 'delayed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  scheduledTime: z.string().optional(),
  actualTime: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional()
})