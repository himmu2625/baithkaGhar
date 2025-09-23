import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { StaffTaskManagementService } from '@/lib/services/staff-task-management'
import { z } from 'zod'

const createTaskFromBookingSchema = z.object({
  bookingId: z.string(),
  event: z.enum(['booking_confirmed', 'guest_checked_in', 'guest_checked_out', 'booking_cancelled'])
})

const assignTaskSchema = z.object({
  taskId: z.string(),
  staffId: z.string()
})

const updateTaskSchema = z.object({
  taskId: z.string(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'overdue']),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  actualDuration: z.number().optional(),
  guestFeedback: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  }).optional()
})

// POST /api/os/staff/tasks - Create tasks from booking event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = createTaskFromBookingSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    // Validate access to the booking's property
    const { connectToDatabase } = await import('@/lib/mongodb')
    const Booking = (await import('@/models/Booking')).default
    await connectToDatabase()

    const booking = await Booking.findById(validatedData.bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, booking.propertyId.toString())
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await StaffTaskManagementService.createTasksFromBookingEvent(
      validatedData.bookingId,
      validatedData.event
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create tasks'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tasksCreated: result.tasksCreated
    })

  } catch (error) {
    console.error('Create staff tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to create staff tasks' },
      { status: 500 }
    )
  }
}

// GET /api/os/staff/tasks - Get staff tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assignedTo')
    const date = searchParams.get('date')
    const bookingId = searchParams.get('bookingId')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const filters: any = {}
    if (status) filters.status = status
    if (category) filters.category = category
    if (assignedTo) filters.assignedTo = assignedTo
    if (date) filters.date = new Date(date)
    if (bookingId) filters.bookingId = bookingId

    const tasks = await StaffTaskManagementService.getTasksByProperty(propertyId, filters)

    return NextResponse.json({
      success: true,
      tasks
    })

  } catch (error) {
    console.error('Get staff tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff tasks' },
      { status: 500 }
    )
  }
}

// PUT /api/os/staff/tasks - Update task or assign task
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is an assignment or status update
    if (body.staffId) {
      // Assignment
      let validatedData
      try {
        validatedData = assignTaskSchema.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }, { status: 400 })
        }
        throw error
      }

      const result = await StaffTaskManagementService.assignTask(
        validatedData.taskId,
        validatedData.staffId,
        session.user?.email || 'unknown'
      )

      if (!result.success) {
        return NextResponse.json({
          error: result.error || 'Failed to assign task'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true
      })

    } else {
      // Status update
      let validatedData
      try {
        validatedData = updateTaskSchema.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }, { status: 400 })
        }
        throw error
      }

      const updates: any = {}
      if (validatedData.notes) updates.notes = validatedData.notes
      if (validatedData.photos) updates.photos = validatedData.photos
      if (validatedData.actualDuration) updates.actualDuration = validatedData.actualDuration
      if (validatedData.guestFeedback) {
        updates.guestFeedback = {
          ...validatedData.guestFeedback,
          submittedAt: new Date()
        }
      }

      const result = await StaffTaskManagementService.updateTaskStatus(
        validatedData.taskId,
        validatedData.status,
        updates
      )

      if (!result.success) {
        return NextResponse.json({
          error: result.error || 'Failed to update task'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true
      })
    }

  } catch (error) {
    console.error('Update staff task API error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff task' },
      { status: 500 }
    )
  }
}