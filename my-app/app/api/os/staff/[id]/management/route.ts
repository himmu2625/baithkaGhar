import { NextRequest, NextResponse } from 'next/server'
import { StaffService } from '@/lib/services/os/staff-service'
import { auth } from '@/lib/auth'

// GET /api/os/staff/[id]/management - Get staff management dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`👥 [GET /api/os/staff/${params.id}/management] Fetching staff management data`)
    
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Parse query parameters for staff filters
    const staffFilters: any = { propertyId }
    
    if (searchParams.get('department')) {
      staffFilters.department = searchParams.get('department')
    }
    
    if (searchParams.get('role')) {
      staffFilters.role = searchParams.get('role')
    }
    
    if (searchParams.get('status')) {
      staffFilters.status = searchParams.get('status')
    }
    
    if (searchParams.get('search')) {
      staffFilters.search = searchParams.get('search')
    }
    
    if (searchParams.get('page')) {
      staffFilters.page = parseInt(searchParams.get('page')!)
    }
    
    if (searchParams.get('limit')) {
      staffFilters.limit = parseInt(searchParams.get('limit')!)
    }

    // Parse task filters
    const taskFilters: any = { propertyId }
    
    if (searchParams.get('taskStatus')) {
      taskFilters.status = searchParams.get('taskStatus')
    }
    
    if (searchParams.get('taskPriority')) {
      taskFilters.priority = searchParams.get('taskPriority')
    }
    
    if (searchParams.get('assignedTo')) {
      taskFilters.assignedTo = searchParams.get('assignedTo')
    }

    // Get staff schedule date range
    const scheduleStart = searchParams.get('scheduleStart') 
      ? new Date(searchParams.get('scheduleStart')!)
      : new Date()
    const scheduleEnd = searchParams.get('scheduleEnd')
      ? new Date(searchParams.get('scheduleEnd')!)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days

    // Fetch all management data
    const [staffResult, tasksResult, scheduleResult] = await Promise.all([
      StaffService.getStaffMembers(staffFilters),
      StaffService.getTasks(taskFilters),
      StaffService.getShiftSchedule(propertyId, { start: scheduleStart, end: scheduleEnd })
    ])

    if (!staffResult.success) {
      return NextResponse.json(
        { error: staffResult.error },
        { status: 400 }
      )
    }

    if (!tasksResult.success) {
      return NextResponse.json(
        { error: tasksResult.error },
        { status: 400 }
      )
    }

    if (!scheduleResult.success) {
      return NextResponse.json(
        { error: scheduleResult.error },
        { status: 400 }
      )
    }
    
    console.log(`✅ [GET /api/os/staff/${propertyId}/management] Management data retrieved successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      data: {
        staff: staffResult.data,
        tasks: tasksResult.data,
        schedule: scheduleResult.data,
        scheduleRange: {
          start: scheduleStart.toISOString(),
          end: scheduleEnd.toISOString()
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [GET /api/os/staff/${params?.id}/management] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/os/staff/[id]/management - Create staff member, task, or shift
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`👥 [POST /api/os/staff/${params.id}/management] Creating new staff resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage staff
    if (!['admin', 'super_admin', 'property_manager', 'hr_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { action, data } = body

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Action and data are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action) {
      case 'createStaff':
        const { firstName, lastName, email, phone, department, role, hireDate, hourlyRate, permissions } = data
        
        if (!firstName || !lastName || !email || !department || !role) {
          return NextResponse.json(
            { error: 'First name, last name, email, department, and role are required for staff creation' },
            { status: 400 }
          )
        }

        // Generate employee ID
        const employeeId = `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        
        result = await StaffService.createStaffMember({
          employeeId,
          firstName,
          lastName,
          email,
          phone: phone || '',
          department,
          role,
          status: 'active',
          hireDate: hireDate ? new Date(hireDate) : new Date(),
          hourlyRate: hourlyRate || 0,
          permissions: permissions || [],
          shifts: [],
          propertyId
        })
        break
        
      case 'createTask':
        const { title, description, assignedTo, department: taskDept, priority, dueDate, estimatedDuration, roomNumbers } = data
        
        if (!title || !assignedTo || !taskDept || !priority || !dueDate) {
          return NextResponse.json(
            { error: 'Title, assignedTo, department, priority, and due date are required for task creation' },
            { status: 400 }
          )
        }

        result = await StaffService.createTask({
          title,
          description: description || '',
          assignedTo,
          assignedBy: session.user.id,
          department: taskDept,
          priority,
          status: 'pending',
          dueDate: new Date(dueDate),
          estimatedDuration: estimatedDuration || 60,
          roomNumbers: roomNumbers || [],
          propertyId
        })
        break
        
      case 'createShift':
        const { staffId, date, startTime, endTime, department: shiftDept } = data
        
        if (!staffId || !date || !startTime || !endTime || !shiftDept) {
          return NextResponse.json(
            { error: 'Staff ID, date, start time, end time, and department are required for shift creation' },
            { status: 400 }
          )
        }

        result = await StaffService.createShift({
          staffId,
          date: new Date(date),
          startTime,
          endTime,
          department: shiftDept,
          status: 'scheduled'
        })
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Operation failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [POST /api/os/staff/${propertyId}/management] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [POST /api/os/staff/${params?.id}/management] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/os/staff/[id]/management - Update staff member, task, or shift
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`👥 [PUT /api/os/staff/${params.id}/management] Updating staff resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update staff resources
    if (!['admin', 'super_admin', 'property_manager', 'hr_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { action, resourceId, updates } = body

    if (!action || !resourceId || !updates) {
      return NextResponse.json(
        { error: 'Action, resource ID, and updates are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action) {
      case 'updateStaff':
        result = await StaffService.updateStaffMember(resourceId, updates)
        break
        
      case 'updateTaskStatus':
        const { status } = updates
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for task status update' },
            { status: 400 }
          )
        }
        result = await StaffService.updateTaskStatus(resourceId, status, session.user.id)
        break
        
      case 'checkInStaff':
        result = await StaffService.checkInStaff(resourceId, session.user.id)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Update failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [PUT /api/os/staff/${propertyId}/management] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      resourceId,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [PUT /api/os/staff/${params?.id}/management] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/os/staff/[id]/management - Delete staff member, task, or shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`👥 [DELETE /api/os/staff/${params.id}/management] Deleting staff resource`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete staff resources
    if (!['admin', 'super_admin', 'property_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const action = searchParams.get('action')
    const resourceId = searchParams.get('resourceId')

    if (!action || !resourceId) {
      return NextResponse.json(
        { error: 'Action and resource ID are required' },
        { status: 400 }
      )
    }

    // For safety, we'll typically mark resources as inactive rather than delete
    let result: any = { success: true, message: 'Resource marked as inactive' }

    switch (action) {
      case 'deleteStaff':
        // Mark staff as terminated instead of deleting
        result = await StaffService.updateStaffMember(resourceId, { 
          status: 'terminated',
          updatedAt: new Date()
        })
        break
        
      case 'deleteTask':
        // Mark task as cancelled instead of deleting
        result = await StaffService.updateTaskStatus(resourceId, 'cancelled', session.user.id)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Deletion failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [DELETE /api/os/staff/${propertyId}/management] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      resourceId,
      message: result.message || 'Resource deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [DELETE /api/os/staff/${params?.id}/management] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}