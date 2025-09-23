import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GuestLoyaltyService } from '@/lib/services/guest-loyalty-service'
import { z } from 'zod'

const redeemRewardSchema = z.object({
  memberId: z.string(),
  rewardId: z.string()
})

// GET /api/os/loyalty/rewards - Get available rewards for member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const availableRewards = await GuestLoyaltyService.getAvailableRewards(memberId)

    return NextResponse.json({
      success: true,
      rewards: availableRewards
    })

  } catch (error) {
    console.error('Get available rewards API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available rewards' },
      { status: 500 }
    )
  }
}

// POST /api/os/loyalty/rewards - Redeem reward
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
      validatedData = redeemRewardSchema.parse(body)
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

    const result = await GuestLoyaltyService.redeemReward(
      validatedData.memberId,
      validatedData.rewardId
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to redeem reward'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      redemptionId: result.redemptionId
    })

  } catch (error) {
    console.error('Redeem reward API error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}