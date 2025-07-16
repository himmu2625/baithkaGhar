import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgent from '@/models/TravelAgent';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find travel agent by email
    const travelAgent = await TravelAgent.findOne({ email: email.toLowerCase() });
    
    if (!travelAgent) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (travelAgent.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password (assuming password is stored in the model)
    // Note: You may need to add password field to TravelAgent model
    const isValidPassword = await bcrypt.compare(password, travelAgent.password || '');
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last active timestamp
    travelAgent.lastActiveAt = new Date();
    await travelAgent.save();

    // Create JWT token
    const token = sign(
      { 
        id: travelAgent._id,
        email: travelAgent.email,
        role: 'travel_agent',
        name: travelAgent.name,
        companyName: travelAgent.companyName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      travelAgent: {
        id: travelAgent._id,
        name: travelAgent.name,
        email: travelAgent.email,
        companyName: travelAgent.companyName,
        status: travelAgent.status,
        referralCode: travelAgent.formattedReferralCode,
        commissionDisplay: travelAgent.commissionDisplay
      }
    });

    response.cookies.set('travel-agent-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Travel agent login error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to login' },
      { status: 500 }
    );
  }
} 