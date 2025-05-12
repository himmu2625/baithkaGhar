import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Route to export user data for migration
export async function GET(req: NextRequest) {
  try {
    // Get the session using the auth helper
    const session = await auth();
    
    console.log('User session in export API:', session?.user);
    
    // Safely check admin role with optional chaining
    const userRole = session?.user?.role as string | undefined;
    
    // Special case for super admin email
    if (session?.user?.email === 'anuragsingh@baithakaghar.com') {
      console.log('Super admin access detected');
      // Force allow without other checks
    } else if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      console.log('Unauthorized access attempt with role:', userRole);
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    // Connect to the database
    try {
      await dbConnect();
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

    console.log('Querying users collection...');
    // Get the user data, excluding sensitive information
    let users;
    try {
      users = await User.find({}).select({
        name: 1,
        email: 1,
        phone: 1,
        address: 1,
        dob: 1,
        isAdmin: 1,
        role: 1,
        profileComplete: 1,
        createdAt: 1,
        updatedAt: 1,
        googleId: 1,
      });
      console.log(`Found ${users.length} users in the database`);
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

    // Return the users as JSON with a secure download token
    const exportToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    return NextResponse.json({
      success: true,
      users,
      exportToken,
      exportedAt: new Date().toISOString(),
      count: users.length
    });
  } catch (error: any) {
    console.error("Error exporting users:", error);
    
    return NextResponse.json(
      { success: false, message: error.message || "Failed to export users" },
      { status: 500 }
    );
  }
} 