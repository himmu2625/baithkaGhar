import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/dbConnect'
import User from '@/models/User'

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication using JWT token
    let token;
    try {
      token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      });

      console.log("Auth token:", token ? "Found" : "Not found");
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { message: 'Authentication error', details: (authError as Error).message },
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
    try {
      await dbConnect()
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Database connection error', details: (dbError as Error).message },
        { status: 500 }
      )
    }
    
    // Find user by email
    let user;
    try {
      user = await User.findOne({ email: token.email }).select('-password')
    } catch (findError) {
      console.error('Error finding user:', findError);
      return NextResponse.json(
        { message: 'Error finding user profile', details: (findError as Error).message },
        { status: 500 }
      )
    }
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Format the response
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      dob: user.dob ? user.dob.toISOString().split('T')[0] : '', // Format as YYYY-MM-DD
      profileComplete: user.profileComplete,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      user: userProfile
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { message: error.message || 'An error occurred while fetching profile' },
      { status: 500 }
    )
  }
}