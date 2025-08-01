import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/dbConnect'
import Booking from '@/models/Booking'
import User from '@/models/User'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    let token;
    try {
      token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      });
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { message: 'Authentication error' },
        { status: 500 }
      )
    }
    
    if (!token || !token.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await dbConnect()
    
    // Get all bookings with user details
    const bookings = await Booking.find({})
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    
    // Get user details
    const user = await User.findOne({ email: token.email }).lean()
    
    const debugData = {
      currentUser: {
        email: token.email,
        id: user?._id,
        name: user?.name
      },
      totalBookings: await Booking.countDocuments(),
      sampleBookings: bookings.map(booking => ({
        bookingId: booking._id,
        userId: booking.userId,
        userEmail: booking.userId?.email,
        userName: booking.userId?.name,
        propertyTitle: booking.propertyId?.title,
        status: booking.status,
        createdAt: booking.createdAt
      })),
      userBookings: bookings.filter(booking => 
        booking.userId?.email === token.email
      ).map(booking => ({
        bookingId: booking._id,
        userId: booking.userId,
        propertyTitle: booking.propertyId?.title,
        status: booking.status,
        createdAt: booking.createdAt
      }))
    }
    
    return NextResponse.json({
      success: true,
      debug: debugData
    })
  } catch (error: any) {
    console.error('Debug bookings error:', error)
    return NextResponse.json(
      { message: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}