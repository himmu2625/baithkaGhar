import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/dbConnect'
import User from '@/models/User'
import { z } from 'zod'

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// Schema validation for profile data
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  dob: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication using JWT token instead of getServerSession
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
    
    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const validation = profileSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.format() },
        { status: 400 }
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
      user = await User.findOne({ email: token.email })
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
    
    // Process date of birth if provided
    let dob = undefined
    if (validation.data.dob) {
      dob = new Date(validation.data.dob)
      // Check if date is valid
      if (isNaN(dob.getTime())) {
        return NextResponse.json(
          { message: 'Invalid date of birth' },
          { status: 400 }
        )
      }
    }
    
    // Update user profile
    try {
      user.name = validation.data.name
      if (validation.data.phone) user.phone = validation.data.phone
      if (validation.data.address) user.address = validation.data.address
      if (dob) user.dob = dob
      user.profileComplete = true
      
      await user.save()
    } catch (saveError) {
      console.error('Error saving user profile:', saveError);
      return NextResponse.json(
        { message: 'Error updating profile', details: (saveError as Error).message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        profileComplete: true
      }
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { message: error.message || 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
} 