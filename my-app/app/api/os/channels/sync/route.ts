import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { ChannelManager } from '@/lib/services/channel-management/channel-manager'
import { z } from 'zod'

const syncChannelsSchema = z.object({
  propertyId: z.string(),
  channels: z.array(z.enum(['booking_com', 'airbnb', 'expedia'])).optional()
})

const inventoryUpdateSchema = z.object({
  propertyId: z.string(),
  updates: z.array(z.object({
    roomTypeId: z.string(),
    date: z.string().datetime().transform(val => new Date(val)),
    availability: z.number().min(0),
    rate: z.number().min(0).optional(),
    currency: z.string().optional(),
    restrictions: z.object({
      minimumStay: z.number().optional(),
      maximumStay: z.number().optional(),
      closedToArrival: z.boolean().optional(),
      closedToDeparture: z.boolean().optional(),
      stopSell: z.boolean().optional()
    }).optional()
  }))
})

// POST /api/os/channels/sync - Sync all channels
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
      validatedData = syncChannelsSchema.parse(body)
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

    const syncResults = await ChannelManager.syncAllChannels(validatedData.propertyId)

    return NextResponse.json({
      success: true,
      results: syncResults
    })

  } catch (error) {
    console.error('Channel sync API error:', error)
    return NextResponse.json(
      { error: 'Failed to sync channels' },
      { status: 500 }
    )
  }
}

// PUT /api/os/channels/sync - Update inventory across channels
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
      validatedData = inventoryUpdateSchema.parse(body)
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

    const result = await ChannelManager.updateInventoryAcrossChannels(
      validatedData.propertyId,
      validatedData.updates
    )

    return NextResponse.json({
      success: result.success,
      errors: result.errors
    })

  } catch (error) {
    console.error('Inventory update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}