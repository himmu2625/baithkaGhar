import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db/dbConnect"
import User from "@/models/User"
import { setUserAsSuperAdmin } from "@/lib/permissions"
import { getDefaultPermissions } from "@/config/permissions"

export const dynamic = 'force-dynamic'

// This endpoint is to be used during initial setup to create the first super_admin
// It should only work if there are no existing super_admins
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect()
    
    // Parse request body
    const body = await req.json()
    const { email, setupKey } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }
    
    // For security, require a setup key that matches the env var
    // This prevents unauthorized access to this endpoint
    const requiredSetupKey = process.env.ADMIN_SETUP_KEY
    if (!setupKey || setupKey !== requiredSetupKey) {
      return NextResponse.json(
        { success: false, message: "Invalid setup key" },
        { status: 403 }
      )
    }
    
    // Check if any super_admin already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" })
    
    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Setup already completed. A super admin already exists." 
        },
        { status: 400 }
      )
    }
    
    // Find the user that should be made super_admin
    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found with the provided email" },
        { status: 404 }
      )
    }
    
    // Make the user a super_admin
    user.role = "super_admin"
    user.isAdmin = true
    user.permissions = getDefaultPermissions("super_admin")
    await user.save()
    
    return NextResponse.json({
      success: true,
      message: "Super admin has been set up successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error: any) {
    console.error("Error setting up super admin:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to set up super admin" },
      { status: 500 }
    )
  }
} 