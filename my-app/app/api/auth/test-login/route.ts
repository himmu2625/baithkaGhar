import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, method } = await request.json();
    
    console.log('Testing login with:', { method, email: email ? '✓' : '✗', password: password ? '✓' : '✗' });
    
    // Test direct database connection first
    try {
      console.log('Connecting to MongoDB...');
      await connectMongo();
      console.log('MongoDB connection successful');
      
      if (method === 'credentials' && email && password) {
        console.log('Testing credentials login...');
        const user = await User.findOne({ email });
        
        if (!user) {
          return NextResponse.json({ 
            success: false, 
            error: 'User not found',
            stage: 'database_query'
          }, { status: 404 });
        }
        
        console.log('User found, checking password...');
        const isValid = await user.comparePassword(password);
        
        if (!isValid) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid password',
            stage: 'password_check'
          }, { status: 401 });
        }
        
        // Create a manual session token to test if token creation works
        const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
        if (!secret) {
          return NextResponse.json({ 
            success: false, 
            error: 'No authentication secret available',
            stage: 'token_creation'
          }, { status: 500 });
        }
        
        console.log('Creating test token...');
        const token = await new SignJWT({
          sub: user._id.toString(),
          email: user.email,
          name: user.name,
          profileComplete: user.profileComplete
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('30m') // Short expiry for test
          .sign(new TextEncoder().encode(secret));
        
        // Set a test cookie
        cookies().set('test-auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 60, // 30 minutes
          path: '/',
        });
        
        return NextResponse.json({
          success: true,
          message: 'Test login successful',
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            profileComplete: user.profileComplete
          }
        });
      } else if (method === 'otp') {
        // Test if we can create a test user for OTP
        console.log('Testing OTP authentication path...');
        
        // This just tests the path, doesn't actually create an OTP
        return NextResponse.json({
          success: true,
          message: 'OTP path available',
          testCode: '123456',
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid method or missing credentials',
        stage: 'input_validation'
      }, { status: 400 });
      
    } catch (dbError: any) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json({
        success: false,
        error: dbError.message,
        stage: 'database_connection'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test login error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stage: 'request_processing'
    }, { status: 500 });
  }
} 