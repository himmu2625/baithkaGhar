import { NextRequest, NextResponse } from 'next/server'
import { PropertyService } from '@/lib/services/os/property-service'
import { auth } from '@/lib/auth'

// GET /api/os/property/[id]/stats - Get property statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🏨 [GET /api/os/property/${params.id}/stats] Fetching property stats`)
    
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = params

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get property stats using PropertyService
    const stats = await PropertyService.getPropertyStats(propertyId)
    
    console.log(`✅ [GET /api/os/property/${propertyId}/stats] Stats retrieved successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [GET /api/os/property/${params?.id}/stats] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/os/property/[id]/stats - Update property information (affects stats)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🏨 [PUT /api/os/property/${params.id}/stats] Updating property`)
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update property
    if (!['admin', 'super_admin', 'property_manager'].includes(session.user.role)) {
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

    // Update property using PropertyService
    const updateResult = await PropertyService.updateProperty(propertyId, body)
    
    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 400 }
      )
    }

    // Get updated stats
    const updatedStats = await PropertyService.getPropertyStats(propertyId)
    
    console.log(`✅ [PUT /api/os/property/${propertyId}/stats] Property updated successfully`)

    return NextResponse.json({
      success: true,
      propertyId,
      property: updateResult.property,
      stats: updatedStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [PUT /api/os/property/${params?.id}/stats] Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}