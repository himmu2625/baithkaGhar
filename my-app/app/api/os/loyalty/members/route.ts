import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { GuestLoyaltyService } from '@/lib/services/guest-loyalty-service'
import { z } from 'zod'

const createMemberSchema = z.object({
  userId: z.string(),
  bookingId: z.string().optional()
})

const addPointsSchema = z.object({
  memberId: z.string(),
  points: z.number().min(1),
  description: z.string(),
  source: z.enum(['booking', 'review', 'referral', 'promotion', 'adjustment', 'bonus']),
  referenceId: z.string().optional()
})

// POST /api/os/loyalty/members - Create or update loyalty member
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
      validatedData = createMemberSchema.parse(body)
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

    // If booking ID is provided, validate access to the booking's property
    if (validatedData.bookingId) {
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
    }

    const member = await GuestLoyaltyService.createOrUpdateMember(validatedData.userId)

    return NextResponse.json({
      success: true,
      member
    })

  } catch (error) {
    console.error('Create loyalty member API error:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty member' },
      { status: 500 }
    )
  }
}

// GET /api/os/loyalty/members - Get loyalty member information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = searchParams.get('memberId')
    const userId = searchParams.get('userId')

    if (!memberId && !userId) {
      return NextResponse.json({ error: 'Member ID or User ID is required' }, { status: 400 })
    }

    let member
    if (memberId) {
      member = await GuestLoyaltyService.getMember(memberId)
    } else if (userId) {
      member = await GuestLoyaltyService.getMemberByUserId(userId)
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get available rewards for the member
    const availableRewards = await GuestLoyaltyService.getAvailableRewards(member.id)

    return NextResponse.json({
      success: true,
      member,
      availableRewards
    })

  } catch (error) {
    console.error('Get loyalty member API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty member' },
      { status: 500 }
    )
  }
}

// PUT /api/os/loyalty/members - Add points to member account
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
      validatedData = addPointsSchema.parse(body)
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

    // Get member to validate they exist
    const member = await GuestLoyaltyService.getMember(validatedData.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Add points transaction
    await GuestLoyaltyService.addPointsTransaction({
      memberId: validatedData.memberId,
      type: 'earned',
      points: validatedData.points,
      description: validatedData.description,
      referenceId: validatedData.referenceId,
      source: validatedData.source
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Add points API error:', error)
    return NextResponse.json(
      { error: 'Failed to add points' },
      { status: 500 }
    )
  }
}