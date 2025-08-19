import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PropertyLogin from '@/models/PropertyLogin';
import Property from '@/models/Property';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find property login by username
    const propertyLogin = await PropertyLogin.findOne({ username });

    if (!propertyLogin) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!propertyLogin.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (propertyLogin.isAccountLocked()) {
      return NextResponse.json(
        { success: false, message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await propertyLogin.comparePassword(password);

    if (!isValidPassword) {
      // Record failed login attempt
      propertyLogin.addLoginAttempt(false, request.headers.get('x-forwarded-for') || 'unknown', request.headers.get('user-agent') || 'unknown');
      await propertyLogin.save();

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get property details
    const property = await Property.findById(propertyLogin.propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    // Record successful login attempt
    propertyLogin.addLoginAttempt(true, request.headers.get('x-forwarded-for') || 'unknown', request.headers.get('user-agent') || 'unknown');
    await propertyLogin.save();

    // Return success with property and user details
    return NextResponse.json({
      success: true,
      data: {
        propertyId: propertyLogin.propertyId.toString(),
        propertyName: property.name || property.title,
        username: propertyLogin.username,
        role: 'Property Manager',
        permissions: ['dashboard', 'inventory', 'bookings', 'financial', 'staff', 'reports', 'settings'],
        lastLogin: propertyLogin.lastLogin,
        property: {
          id: String(property._id),
          name: property.name || property.title,
          address: property.address,
          verificationStatus: property.verificationStatus
        }
      }
    });

  } catch (error) {
    console.error('OS login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
