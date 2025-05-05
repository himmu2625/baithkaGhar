import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/dbConnect'
import User from '@/models/User'
import { z } from 'zod'

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Schema validation for profile data
const profileSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  dob: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    console.log("Alternative profile completion endpoint called");
    
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Validate the data
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.format());
      return NextResponse.json(
        { message: 'Invalid data', errors: validation.error.format() },
        { status: 400 }
      );
    }
    
    // Connect to database
    try {
      await dbConnect();
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Database connection error', details: (dbError as Error).message },
        { status: 500 }
      );
    }
    
    // Find user by email (without requiring authentication)
    let user;
    try {
      user = await User.findOne({ email: validation.data.email });
      console.log("User lookup result:", user ? "Found" : "Not found");
      
      if (!user) {
        return NextResponse.json(
          { message: 'User not found with this email' },
          { status: 404 }
        );
      }
    } catch (findError) {
      console.error('Error finding user:', findError);
      return NextResponse.json(
        { message: 'Error finding user profile', details: (findError as Error).message },
        { status: 500 }
      );
    }
    
    // Process date of birth if provided
    let dob = undefined;
    if (validation.data.dob) {
      dob = new Date(validation.data.dob);
      // Check if date is valid
      if (isNaN(dob.getTime())) {
        return NextResponse.json(
          { message: 'Invalid date of birth' },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    try {
      user.name = validation.data.name;
      if (validation.data.phone) user.phone = validation.data.phone;
      if (validation.data.address) user.address = validation.data.address;
      if (dob) user.dob = dob;
      user.profileComplete = true;
      
      await user.save();
      console.log("User profile updated successfully");
    } catch (saveError) {
      console.error('Error saving user profile:', saveError);
      return NextResponse.json(
        { message: 'Error updating profile', details: (saveError as Error).message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        profileComplete: true
      }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
} 