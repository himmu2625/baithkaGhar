import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import PropertyLogin from '@/models/PropertyLogin';
import Property from '@/models/Property';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    // Get total count
    const total = await PropertyLogin.countDocuments(query);

    // Get paginated results with explicit typing for lean + populate
    type PopulatedPropertyLogin = {
      _id: { toString(): string }
      propertyId: { _id: { toString(): string }; name?: string; title?: string }
      username: string
      isActive: boolean
      lastLogin?: Date | null
      createdAt: Date
    }

    const propertyLogins = (await PropertyLogin.find(query)
      .populate('propertyId', 'name title address verificationStatus')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()) as unknown as PopulatedPropertyLogin[];

    // Transform data to match expected format
    const credentials = propertyLogins.map(login => ({
      id: login._id.toString(),
      propertyId: login.propertyId._id.toString(),
      propertyName: login.propertyId.name || login.propertyId.title,
      username: login.username,
      password: '********', // Don't return actual password
      isActive: login.isActive,
      lastLogin: login.lastLogin,
      createdAt: login.createdAt.toISOString().split('T')[0],
      permissions: ['dashboard', 'inventory', 'bookings', 'financial', 'staff', 'reports', 'settings']
    }));

    return NextResponse.json({
      success: true,
      data: credentials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching property credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { propertyId, propertyName, username, password, isActive, permissions } = body;

    // Validation
    if (!propertyId || !propertyName || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if property already has credentials
    const existingCredential = await PropertyLogin.findOne({ propertyId });
    if (existingCredential) {
      return NextResponse.json(
        { error: 'Property already has credentials' },
        { status: 409 }
      );
    }

    // Check if username is already taken
    const existingUsername = await PropertyLogin.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new property login
    const newPropertyLogin = new PropertyLogin({
      propertyId,
      username,
      passwordHash,
      isActive: isActive ?? true
    });

    await newPropertyLogin.save();

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: newPropertyLogin._id.toString(),
        propertyId: newPropertyLogin.propertyId.toString(),
        propertyName,
        username: newPropertyLogin.username,
        password: '********',
        isActive: newPropertyLogin.isActive,
        createdAt: newPropertyLogin.createdAt.toISOString().split('T')[0],
        permissions: permissions || ['dashboard', 'inventory', 'bookings', 'financial', 'staff', 'reports', 'settings']
      },
      message: 'Property credential created successfully'
    });

  } catch (error) {
    console.error('Error creating property credential:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { id, username, password, isActive, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    const propertyLogin = await PropertyLogin.findById(id);
    if (!propertyLogin) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (username && username !== propertyLogin.username) {
      // Check if new username is already taken
      const existingUsername = await PropertyLogin.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
      propertyLogin.username = username;
    }

    if (password) {
      propertyLogin.passwordHash = await bcrypt.hash(password, 12);
    }

    if (isActive !== undefined) {
      propertyLogin.isActive = isActive;
    }

    await propertyLogin.save();

    // Get property details for response
    const property = await Property.findById(propertyLogin.propertyId);

    return NextResponse.json({
      success: true,
      data: {
        id: propertyLogin._id.toString(),
        propertyId: propertyLogin.propertyId.toString(),
        propertyName: property?.name || property?.title,
        username: propertyLogin.username,
        password: '********',
        isActive: propertyLogin.isActive,
        createdAt: propertyLogin.createdAt.toISOString().split('T')[0],
        permissions: permissions || ['dashboard', 'inventory', 'bookings', 'financial', 'staff', 'reports', 'settings']
      },
      message: 'Property credential updated successfully'
    });

  } catch (error) {
    console.error('Error updating property credential:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    const propertyLogin = await PropertyLogin.findById(id);
    if (!propertyLogin) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Delete credential
    await PropertyLogin.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Property credential deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting property credential:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 