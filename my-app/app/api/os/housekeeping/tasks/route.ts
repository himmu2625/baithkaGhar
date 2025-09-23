import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { HousekeepingService } from '@/lib/services/housekeeping-service'
import { z } from 'zod'

const createTaskSchema = z.object({
  bookingId: z.string(),
  taskType: z.enum(['checkout_cleaning', 'maintenance_cleaning', 'deep_cleaning', 'inspection', 'turnover', 'special_request']).default('checkout_cleaning')
})

const assignTaskSchema = z.object({
  taskId: z.string(),
  staffId: z.string()
})

const updateTaskSchema = z.object({
  taskId: z.string(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'quality_check']),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  actualDuration: z.number().optional(),
  qualityCheck: z.object({
    checkedBy: z.string(),
    score: z.number().min(1).max(10),
    issues: z.array(z.string()),
    approved: z.boolean(),
    comments: z.string().optional()
  }).optional()
})

// POST /api/os/housekeeping/tasks - Create housekeeping task
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
      validatedData = createTaskSchema.parse(body)
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

    const result = await HousekeepingService.createTaskFromBooking(
      validatedData.bookingId,
      validatedData.taskType
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create housekeeping task'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      taskId: result.taskId
    })

  } catch (error) {
    console.error('Create housekeeping task API error:', error)
    return NextResponse.json(
      { error: 'Failed to create housekeeping task' },
      { status: 500 }
    )
  }
}

// GET /api/os/housekeeping/tasks - Get housekeeping tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const roomNumber = searchParams.get('roomNumber')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const filters: any = {}
    if (status) filters.status = status
    if (assignedTo) filters.assignedTo = assignedTo
    if (roomNumber) filters.roomNumber = roomNumber
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)

    const tasks = await HousekeepingService.getTasksByProperty(propertyId, filters)

    return NextResponse.json({
      success: true,
      tasks
    })

  } catch (error) {
    console.error('Get housekeeping tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch housekeeping tasks' },
      { status: 500 }
    )
  }
}

// PUT /api/os/housekeeping/tasks - Update task status or assign task
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

      const result = await HousekeepingService.assignTask(
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
      if (validatedData.qualityCheck) updates.qualityCheck = {
        ...validatedData.qualityCheck,
        checkedAt: new Date()
      }

      const result = await HousekeepingService.updateTaskStatus(
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
    console.error('Update housekeeping task API error:', error)
    return NextResponse.json(
      { error: 'Failed to update housekeeping task' },
      { status: 500 }
    )
  }
}