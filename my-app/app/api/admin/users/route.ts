import { NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectMongo } from '@/lib/db/mongodb'
import { z } from 'zod'
// Remove bcrypt import if not needed for this route
// import bcrypt from 'bcrypt'
import User from '@/models/User'
import Activity from '@/models/Activity'
import Property from '@/models/Property'
import Booking from '@/models/Booking'
import Review from '@/models/Review'

// Define zod schema for user updates
const userUpdateSchema = z.object({
  id: z.string().min(1),
  verified: z.boolean()
})

export const dynamic = 'force-dynamic';

// Get all users with filtering options
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if session and user exist before accessing properties
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await connectMongo()

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter')

    let query = {}
    if (filter === 'verified') {
      query = { emailVerified: { $ne: null } }
    } else if (filter === 'unverified') {
      query = { emailVerified: null }
    }

    // Get all users
    const users = await User.find(query)

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const userId = user._id
        
        const propertyCount = await Property.countDocuments({ userId })
        const bookingCount = await Booking.countDocuments({ userId })
        const reviewCount = await Review.countDocuments({ userId })

        return {
          ...user.toObject(),
          propertyCount,
          bookingCount,
          reviewCount
        }
      })
    )

    return NextResponse.json(usersWithCounts)
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Update user verification status
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if session and user exist before accessing properties
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await connectMongo()
    
    const body = await req.json()
    const { id, verified } = userUpdateSchema.parse(body)

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { emailVerified: verified ? new Date() : null },
      { new: true }
    )

    if (!updatedUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Log activity
    await Activity.create({
      action: verified ? 'VERIFY_USER' : 'UNVERIFY_USER',
      userId: updatedUser._id,
      targetId: id,
      targetModel: 'User',
      details: `Admin ${verified ? 'verified' : 'unverified'} user: ${updatedUser.email}`
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 })
    }
    console.error('PUT /api/admin/users error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 