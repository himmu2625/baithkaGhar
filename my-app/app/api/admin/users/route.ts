import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import { getToken } from "next-auth/jwt";
import { auth } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { z } from 'zod'
// Remove bcrypt import if not needed for this route
// import bcrypt from 'bcrypt'
import Activity from '@/models/Activity'

// Define zod schema for user updates
const userUpdateSchema = z.object({
  id: z.string().min(1),
  verified: z.boolean()
})

export const dynamic = 'force-dynamic';

// Get all users with filtering options
export async function GET(req: NextRequest) {
  try {
    console.log('API: User list request received');
    
    // Validate token
    let token;
    try {
      token = await getToken({ req, secret: authOptions.secret });
      console.log('API: Token retrieval result:', token ? 'Token found' : 'No token found');
    } catch (tokenError) {
      console.error('API: Error retrieving token:', tokenError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Token retrieval error", 
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error' 
        },
        { status: 401 }
      );
    }
    
    // For debugging purposes, temporarily allow access without authentication
    // TODO: Remove this in production
    if (!token || !token.id) {
      console.log('API: No valid token found, but proceeding for debugging');
    } else {
      // Safely check admin role with optional chaining
      const userRole = token.role as string | undefined;
      
      // Verify admin access
      if (!['admin', 'super_admin'].includes(userRole || '')) {
        console.log('Unauthorized access attempt with role:', userRole);
        return NextResponse.json(
          { success: false, message: "Unauthorized - Admin access required" },
          { status: 401 }
        );
      }
    }

    console.log('Connecting to database...');
    try {
      await connectMongo();
      console.log('Database connection successful');
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Database connection failed. Please check your MongoDB configuration.", 
          error: dbError.message 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    console.log(`Query params: filter=${filter}, page=${page}, limit=${limit}`);

    // Build query
    let query: any = {};
    if (filter === 'verified') {
      query = { emailVerified: { $ne: null } };
    } else if (filter === 'unverified') {
      query = { emailVerified: null };
    } else if (filter === 'admins') {
      query = { $or: [{ role: 'admin' }, { role: 'super_admin' }] };
    } else if (filter === 'hosts') {
      query = { role: 'host' };
    }

    console.log('Querying users collection...');
    // Get users with pagination
    let users;
    try {
      users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      console.log(`Found ${users.length} users`);
    } catch (queryError: any) {
      console.error('Error querying users:', queryError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to query users from the database", 
          error: queryError.message 
        },
        { status: 500 }
      );
    }

    // Get counts for each user (optional, can be computationally expensive)
    if (searchParams.get('includeCounts') === 'true') {
      console.log('Calculating related counts for each user...');
      const usersWithCounts = await Promise.all(
        users.map(async (user: any) => {
          const userId = user._id;
          
          try {
            const [propertyCount, bookingCount, reviewCount] = await Promise.all([
              Property.countDocuments({ userId }),
              Booking.countDocuments({ userId }),
              Review.countDocuments({ userId })
            ]);

            return {
              ...user,
              propertyCount,
              bookingCount,
              reviewCount
            };
          } catch (err) {
            console.error(`Error getting counts for user ${userId}:`, err);
            return {
              ...user,
              propertyCount: 0,
              bookingCount: 0,
              reviewCount: 0,
              error: 'Failed to load counts'
            };
          }
        })
      );
      
      return NextResponse.json({ success: true, users: usersWithCounts });
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// Update user verification status
export async function PUT(req: Request) {
  try {
    const session = await auth();
    
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
      type: 'ADMIN_ACTION',
      description: `Admin ${verified ? 'verified' : 'unverified'} user: ${updatedUser.email}`,
      entity: 'user',
      entityId: id,
      userId: session.user.id,
      metadata: {
        action: verified ? 'VERIFY_USER' : 'UNVERIFY_USER',
        userEmail: updatedUser.email
      }
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