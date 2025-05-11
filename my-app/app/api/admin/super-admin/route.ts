import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db/dbConnect"
import User from "@/models/User"
import { setUserAsSuperAdmin } from "@/lib/permissions"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// POST endpoint to set a user as super admin (only existing admins can do this)
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect()
    
    // Get and validate token
    const token = await getToken({ req, secret: authOptions.secret })
    
    // Only super_admin can create another super_admin
    if (!token || token.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Only super admins can create other super admins" },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await req.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }
    
    // Find the user
    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    // Set user as super admin
    await setUserAsSuperAdmin(user._id)
    
    return NextResponse.json({
      success: true,
      message: "User has been upgraded to super admin",
    })
    
  } catch (error: any) {
    console.error("Error setting super admin:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to set super admin" },
      { status: 500 }
    )
  }
}

// This API endpoint can handle multiple user IDs to make them super admins
export async function PUT(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect()
    
    // Get and validate token
    const token = await getToken({ req, secret: authOptions.secret })
    
    // Only super_admin can perform this action
    if (!token || token.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Only super admins can perform this action" },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await req.json()
    const { userIds } = body
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "User IDs array is required" },
        { status: 400 }
      )
    }
    
    // Process each user
    const results = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await setUserAsSuperAdmin(userId)
          return { userId, success: true, name: user.name }
        } catch (error: any) {
          return { userId, success: false, message: error.message }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      results,
    })
    
  } catch (error: any) {
    console.error("Error setting super admins:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to set super admins" },
      { status: 500 }
    )
  }
} 