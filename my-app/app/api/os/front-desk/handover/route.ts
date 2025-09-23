import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { FrontDeskDashboardService } from '@/lib/services/front-desk-dashboard'
import { z } from 'zod'

const createHandoverSchema = z.object({
  propertyId: z.string(),
  date: z.string().datetime().transform(val => new Date(val)),
  fromShift: z.object({
    type: z.enum(['morning', 'afternoon', 'evening', 'night']),
    startTime: z.string(),
    endTime: z.string(),
    staffMember: z.object({
      id: z.string(),
      name: z.string(),
      role: z.string()
    })
  }),
  toShift: z.object({
    type: z.enum(['morning', 'afternoon', 'evening', 'night']),
    startTime: z.string(),
    endTime: z.string(),
    staffMember: z.object({
      id: z.string(),
      name: z.string(),
      role: z.string()
    })
  }),
  handoverItems: z.object({
    guestSituations: z.array(z.object({
      guestName: z.string(),
      roomNumber: z.string(),
      situation: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      actionRequired: z.string(),
      status: z.enum(['pending', 'in_progress', 'resolved']).default('pending')
    })).default([]),
    operationalIssues: z.array(z.object({
      area: z.string(),
      issue: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      reportedAt: z.string().datetime().transform(val => new Date(val)),
      assignedTo: z.string().optional(),
      estimatedResolution: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
      status: z.enum(['reported', 'assigned', 'in_progress', 'resolved']).default('reported')
    })).default([]),
    maintenanceAlerts: z.array(z.object({
      roomNumber: z.string().optional(),
      facility: z.string().optional(),
      issue: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      reportedAt: z.string().datetime().transform(val => new Date(val)),
      workOrderNumber: z.string().optional(),
      status: z.enum(['reported', 'scheduled', 'in_progress', 'completed']).default('reported')
    })).default([]),
    specialInstructions: z.array(z.object({
      category: z.enum(['guest_service', 'operations', 'security', 'management']),
      instruction: z.string(),
      validUntil: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
      importance: z.enum(['info', 'important', 'critical'])
    })).default([]),
    pendingTasks: z.array(z.object({
      taskId: z.string(),
      description: z.string(),
      assignedTo: z.string(),
      deadline: z.string().datetime().transform(val => new Date(val)),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      status: z.enum(['pending', 'in_progress', 'overdue'])
    })).default([])
  }),
  keyMetrics: z.object({
    occupancyRate: z.number(),
    revenue: z.number(),
    averageRate: z.number(),
    arrivals: z.number(),
    departures: z.number(),
    walkIns: z.number(),
    cancellations: z.number(),
    complaints: z.number(),
    compliments: z.number()
  }),
  cashHandover: z.object({
    openingBalance: z.number(),
    totalReceipts: z.number(),
    totalPayouts: z.number(),
    closingBalance: z.number(),
    cashInHand: z.number(),
    variance: z.number(),
    verified: z.boolean(),
    verifiedBy: z.string().optional()
  }).optional(),
  systemStatus: z.object({
    pmsStatus: z.enum(['online', 'offline', 'limited']),
    paymentGateway: z.enum(['online', 'offline', 'maintenance']),
    internetConnection: z.enum(['stable', 'unstable', 'down']),
    phoneSystem: z.enum(['operational', 'issues', 'down']),
    lastBackup: z.string().datetime().transform(val => new Date(val)),
    pendingUpdates: z.number()
  }),
  notes: z.string(),
  acknowledgment: z.object({
    acknowledged: z.boolean().default(false),
    acknowledgedAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    acknowledgedBy: z.string().optional(),
    signature: z.string().optional()
  }).default({ acknowledged: false })
})

const acknowledgeHandoverSchema = z.object({
  handoverId: z.string(),
  acknowledgedBy: z.string(),
  signature: z.string().optional()
})

// POST /api/os/front-desk/handover - Create shift handover
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
      validatedData = createHandoverSchema.parse(body)
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

    const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await FrontDeskDashboardService.createShiftHandover(validatedData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create shift handover'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      handoverId: result.handoverId
    })

  } catch (error) {
    console.error('Create shift handover API error:', error)
    return NextResponse.json(
      { error: 'Failed to create shift handover' },
      { status: 500 }
    )
  }
}

// GET /api/os/front-desk/handover - Get shift handovers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date')
    const shiftType = searchParams.get('shiftType')
    const staffMember = searchParams.get('staffMember')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const filters: any = {}
    if (date) filters.date = new Date(date)
    if (shiftType) filters.shiftType = shiftType
    if (staffMember) filters.staffMember = staffMember

    const handovers = await FrontDeskDashboardService.getShiftHandovers(propertyId, filters)

    return NextResponse.json({
      success: true,
      handovers
    })

  } catch (error) {
    console.error('Get shift handovers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shift handovers' },
      { status: 500 }
    )
  }
}

// PUT /api/os/front-desk/handover - Acknowledge handover
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
      validatedData = acknowledgeHandoverSchema.parse(body)
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

    const result = await FrontDeskDashboardService.acknowledgeHandover(
      validatedData.handoverId,
      validatedData.acknowledgedBy,
      validatedData.signature
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to acknowledge handover'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Acknowledge handover API error:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge handover' },
      { status: 500 }
    )
  }
}