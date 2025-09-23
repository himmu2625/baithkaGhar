import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestServiceRequestService } from '@/lib/services/guest-service-request'
import { z } from 'zod'

const createRequestSchema = z.object({
  bookingId: z.string(),
  category: z.enum(['housekeeping', 'maintenance', 'amenities', 'dining', 'concierge', 'transport', 'other']),
  type: z.string(),
  description: z.string().min(5),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduledFor: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(1)
  })).optional()
})

const updateStatusSchema = z.object({
  requestId: z.string(),
  status: z.enum(['pending', 'acknowledged', 'in_progress', 'completed', 'cancelled']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
})

const feedbackSchema = z.object({
  requestId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

// POST /api/os/services/requests - Create new service request
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
      validatedData = createRequestSchema.parse(body)
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

    const result = await GuestServiceRequestService.createServiceRequest(validatedData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create service request'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      estimatedTime: result.estimatedTime
    })

  } catch (error) {
    console.error('Service request API error:', error)
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}

// GET /api/os/services/requests - Get service requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    let requests = []

    if (bookingId) {
      // Get requests for a specific booking
      const { connectToDatabase } = await import('@/lib/mongodb')
      const Booking = (await import('@/models/Booking')).default
      await connectToDatabase()

      const booking = await Booking.findById(bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const hasAccess = await validateOSAccess(session.user?.email, booking.propertyId.toString())
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      requests = await GuestServiceRequestService.getGuestServiceRequests(bookingId)

    } else if (propertyId) {
      // Get requests for a property
      const hasAccess = await validateOSAccess(session.user?.email, propertyId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const filters: any = {}
      if (status) filters.status = status
      if (category) filters.category = category
      if (priority) filters.priority = priority

      requests = await GuestServiceRequestService.getPropertyServiceRequests(propertyId, filters)

    } else {
      return NextResponse.json({ error: 'Property ID or Booking ID required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    console.error('Get service requests API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

// PUT /api/os/services/requests - Update service request status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    let validatedData
    try {
      validatedData = updateStatusSchema.parse(body)
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

    // Get the service request to validate access
    const serviceRequest = await GuestServiceRequestService.getServiceRequest(validatedData.requestId)
    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, serviceRequest.propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updates: any = {}
    if (validatedData.assignedTo) updates.assignedTo = validatedData.assignedTo
    if (validatedData.notes) updates.notes = validatedData.notes
    if (validatedData.internalNotes) updates.internalNotes = validatedData.internalNotes

    if (validatedData.status === 'in_progress') {
      updates.startedAt = new Date()
    } else if (validatedData.status === 'completed') {
      updates.completedAt = new Date()
    }

    const result = await GuestServiceRequestService.updateRequestStatus(
      validatedData.requestId,
      validatedData.status,
      updates
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to update service request'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Update service request API error:', error)
    return NextResponse.json(
      { error: 'Failed to update service request' },
      { status: 500 }
    )
  }
}