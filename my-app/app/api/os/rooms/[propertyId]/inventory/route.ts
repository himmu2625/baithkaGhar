import { NextRequest, NextResponse } from 'next/server'
import { RoomService } from '@/lib/services/os/room-service'
import { auth } from '@/lib/auth'

// GET /api/os/rooms/[propertyId]/inventory - Get room inventory and status
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    console.log(`🏠 [GET /api/os/rooms/${params.propertyId}/inventory] Fetching room inventory`)
    
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId } = params
    const { searchParams } = new URL(request.url)

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Parse query parameters for filtering
    const filters: any = {}
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')?.split(',')
    }
    
    if (searchParams.get('roomTypes')) {
      filters.roomTypes = searchParams.get('roomTypes')?.split(',')
    }
    
    if (searchParams.get('floors')) {
      filters.floors = searchParams.get('floors')?.split(',').map(Number)
    }
    
    if (searchParams.get('housekeepingStatus')) {
      filters.housekeepingStatus = searchParams.get('housekeepingStatus')?.split(',')
    }
    
    if (searchParams.get('hasMaintenanceIssues')) {
      filters.hasMaintenanceIssues = searchParams.get('hasMaintenanceIssues') === 'true'
    }
    
    if (searchParams.get('availableDate')) {
      filters.availableDate = new Date(searchParams.get('availableDate')!)
    }
    
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!)
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!)
    }

    // Get room inventory using RoomService
    const result = await RoomService.getRoomsByProperty(propertyId, filters)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    console.log(`✅ [GET /api/os/rooms/${propertyId}/inventory] Inventory retrieved: ${result.data?.rooms.length} rooms`)

    return NextResponse.json({
      success: true,
      propertyId,
      ...result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [GET /api/os/rooms/${params?.propertyId}/inventory] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/os/rooms/[propertyId]/inventory - Update room status or housekeeping
export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    console.log(`🏠 [PUT /api/os/rooms/${params.propertyId}/inventory] Updating room status`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update rooms
    if (!['admin', 'super_admin', 'property_manager', 'housekeeping'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { action, roomId, status, housekeepingStatus, notes, assignedTo } = body

    if (!action || !roomId) {
      return NextResponse.json(
        { error: 'Action and room ID are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action) {
      case 'updateStatus':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }
        result = await RoomService.updateRoomStatus(roomId, status, notes)
        break
        
      case 'updateHousekeeping':
        if (!housekeepingStatus) {
          return NextResponse.json(
            { error: 'Housekeeping status is required for updateHousekeeping action' },
            { status: 400 }
          )
        }
        result = await RoomService.updateHousekeepingStatus(roomId, housekeepingStatus, assignedTo)
        break
        
      case 'createMaintenance':
        const { issueType, description, priority } = body
        if (!issueType || !description || !priority) {
          return NextResponse.json(
            { error: 'Issue type, description, and priority are required for maintenance request' },
            { status: 400 }
          )
        }
        
        result = await RoomService.createMaintenanceRequest(roomId, {
          type: issueType,
          description,
          priority,
          reportedBy: session.user.id
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
        { error: result?.message || 'Operation failed' },
        { status: 400 }
      )
    }
    
    console.log(`✅ [PUT /api/os/rooms/${propertyId}/inventory] ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      action,
      propertyId,
      roomId,
      message: result.message,
      ...(result.maintenanceId && { maintenanceId: result.maintenanceId }),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [PUT /api/os/rooms/${params?.propertyId}/inventory] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/os/rooms/[propertyId]/inventory - Update availability for multiple rooms/dates
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    console.log(`🏠 [POST /api/os/rooms/${params.propertyId}/inventory] Updating availability`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update availability
    if (!['admin', 'super_admin', 'property_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { propertyId } = params
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    const { updates } = body

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Validate update objects
    for (const update of updates) {
      if (!update.roomId || !update.date || update.available === undefined) {
        return NextResponse.json(
          { error: 'Each update must include roomId, date, and available fields' },
          { status: 400 }
        )
      }
    }

    // Convert date strings to Date objects
    const processedUpdates = updates.map((update: any) => ({
      ...update,
      date: new Date(update.date)
    }))

    // Update availability using RoomService
    const result = await RoomService.updateAvailability(propertyId, processedUpdates)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
    
    console.log(`✅ [POST /api/os/rooms/${propertyId}/inventory] Availability updated: ${result.updatedCount} records`)

    return NextResponse.json({
      success: true,
      propertyId,
      message: result.message,
      updatedCount: result.updatedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [POST /api/os/rooms/${params?.propertyId}/inventory] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}