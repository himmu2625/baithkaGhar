import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Verify the request is from an admin
    const session = await auth();
    
    // Safely check admin role with optional chaining
    const userRole = session?.user?.role as string | undefined;
    
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the data from the request
    const { users, exportToken } = await req.json();
    
    if (!users || !Array.isArray(users) || !exportToken) {
      return NextResponse.json(
        { success: false, message: "Invalid data format" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Keep track of results
    const results = {
      total: users.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[]
    };
    
    // Process each user
    for (const userData of users) {
      try {
        const { email } = userData;
        
        // Skip if no email
        if (!email) {
          results.skipped++;
          results.details.push(`Skipped user missing email`);
          continue;
        }
        
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Update existing user with new data
          Object.keys(userData).forEach(key => {
            // Don't override the password or other sensitive fields
            if (!['password', '_id', '__v'].includes(key)) {
              // Fix the indexing error with proper type assertion
              const typedUser = existingUser as any;
              typedUser[key] = userData[key];
            }
          });
          
          await existingUser.save();
          results.imported++;
          results.details.push(`Updated existing user: ${email}`);
        } else {
          // Create a new user
          const newUser = new User(userData);
          await newUser.save();
          results.imported++;
          results.details.push(`Created new user: ${email}`);
        }
      } catch (error: any) {
        results.errors++;
        results.details.push(`Error processing user: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${users.length} users: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`,
      results
    });
  } catch (error: any) {
    console.error("Error importing users:", error);
    
    return NextResponse.json(
      { success: false, message: error.message || "Failed to import users" },
      { status: 500 }
    );
  }
} 