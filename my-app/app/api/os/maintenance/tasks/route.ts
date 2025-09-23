import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { MaintenanceService } from '@/lib/services/maintenance-service'
import { z } from 'zod'

const createTaskSchema = z.object({
  propertyId: z.string(),
  roomId: z.string().optional(),
  facilityId: z.string().optional(),
  category: z.enum(['preventive', 'corrective', 'emergency', 'upgrade', 'inspection']),
  type: z.enum(['plumbing', 'electrical', 'hvac', 'furniture', 'appliances', 'structural', 'safety', 'technology', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']),
  title: z.string().min(5),
  description: z.string().min(10),
  estimatedDuration: z.number().min(0.5).max(48), // hours
  estimatedCost: z.number().min(0).optional(),
  scheduledDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  scheduledTime: z.string().optional(),
  deadline: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  assignedTo: z.object({
    staffId: z.string(),
    staffName: z.string(),
    department: z.string(),
    contactInfo: z.string()
  }).optional(),
  externalVendor: z.object({
    companyName: z.string(),
    contactPerson: z.string(),
    phone: z.string(),
    email: z.string(),
    specialtyArea: z.string()
  }).optional(),
  recurringSchedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually']),
    interval: z.number().min(1),
    endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    nextOccurrence: z.string().datetime().transform(val => new Date(val))
  }).optional()
})

const updateTaskSchema = z.object({
  taskId: z.string(),
  status: z.enum(['scheduled', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold', 'requires_parts']),
  workNotes: z.string().optional(),
  actualDuration: z.number().optional(),
  actualCost: z.number().optional(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    quantity: z.number(),
    cost: z.number(),
    supplier: z.string().optional()
  })).optional(),
  beforePhotos: z.array(z.string()).optional(),
  afterPhotos: z.array(z.string()).optional(),
  qualityCheck: z.object({
    checkedBy: z.string(),
    approved: z.boolean(),
    issues: z.array(z.string()).optional(),
    followUpRequired: z.boolean()
  }).optional()
})

// POST /api/os/maintenance/tasks - Create maintenance task
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

    const hasAccess = await validateOSAccess(session.user?.email, validatedData.propertyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const taskData = {
      ...validatedData,
      createdBy: session.user?.email || 'unknown',
      status: 'scheduled' as const
    }

    const result = await MaintenanceService.scheduleMaintenanceAroundBookings(taskData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create maintenance task',
        conflicts: result.conflicts
      }, { status: result.conflicts ? 409 : 500 })
    }

    return NextResponse.json({
      success: true,
      taskId: result.taskId
    })

  } catch (error) {
    console.error('Create maintenance task API error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance task' },
      { status: 500 }
    )
  }
}

// GET /api/os/maintenance/tasks - Get maintenance tasks
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
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
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
    if (category) filters.category = category
    if (priority) filters.priority = priority
    if (assignedTo) filters.assignedTo = assignedTo
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)

    const tasks = await MaintenanceService.getTasksByProperty(propertyId, filters)

    return NextResponse.json({
      success: true,
      tasks
    })

  } catch (error) {
    console.error('Get maintenance tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance tasks' },
      { status: 500 }
    )
  }
}

// PUT /api/os/maintenance/tasks - Update maintenance task
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
    if (validatedData.workNotes) updates.workNotes = validatedData.workNotes
    if (validatedData.actualDuration) updates.actualDuration = validatedData.actualDuration
    if (validatedData.actualCost) updates.actualCost = validatedData.actualCost
    if (validatedData.partsUsed) updates.partsUsed = validatedData.partsUsed
    if (validatedData.beforePhotos) updates.beforePhotos = validatedData.beforePhotos
    if (validatedData.afterPhotos) updates.afterPhotos = validatedData.afterPhotos
    if (validatedData.qualityCheck) {
      updates.qualityCheck = {
        ...validatedData.qualityCheck,
        checkedAt: new Date()
      }
    }

    const result = await MaintenanceService.updateTaskStatus(
      validatedData.taskId,
      validatedData.status,
      updates
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to update maintenance task'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Update maintenance task API error:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance task' },
      { status: 500 }
    )
  }
}