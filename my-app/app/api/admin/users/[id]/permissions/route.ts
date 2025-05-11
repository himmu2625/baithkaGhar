import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db/dbConnect"
import User from "@/models/User"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { PERMISSIONS } from "@/config/permissions"
import { checkPermission } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// GET endpoint to fetch a user's permissions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect()
    
    // Get the user ID from the route params
    const { id } = params
    
    // Validate token
    const token = await getToken({ req, secret: authOptions.secret })
    
    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check permissions
    const hasViewPermission = await checkPermission(req, PERMISSIONS.VIEW_ADMINS)
    const isCurrentUser = token.id === id
    
    if (!isCurrentUser && (token.role !== "super_admin" && !hasViewPermission)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }
    
    // Find the user
    const user = await User.findById(id)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      permissions: user.permissions || []
    })
    
  } catch (error: any) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user permissions" },
      { status: 500 }
    )
  }
}

// PUT endpoint to update a user's permissions
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect()
    
    // Get the user ID from the route params
    const { id } = params
    
    // Validate token
    const token = await getToken({ req, secret: authOptions.secret })
    
    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user can edit permissions
    let canEditPermissions = false
    
    if (token.role === "super_admin") {
      // Super admins can edit anyone's permissions
      canEditPermissions = true
    } else if (token.role === "admin") {
      // Admins can only edit non-super-admin permissions
      const targetUser = await User.findById(id)
      
      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }
      
      // Check admin's permission to edit another admin
      const hasEditPermission = await checkPermission(req, PERMISSIONS.EDIT_ADMIN)
      
      if (targetUser.role !== "super_admin" && hasEditPermission) {
        canEditPermissions = true
      }
    }
    
    if (!canEditPermissions) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to edit this user's permissions" },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await req.json()
    const { permissions } = body
    
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: "Permissions array is required" },
        { status: 400 }
      )
    }
    
    // Validate that all permissions are valid
    const invalidPermissions = permissions.filter(
      perm => !Object.values(PERMISSIONS).includes(perm)
    )
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid permissions provided", 
          invalidPermissions 
        },
        { status: 400 }
      )
    }
    
    // Update the user's permissions
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { permissions },
      { new: true }
    )
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
      permissions: updatedUser.permissions
    })
    
  } catch (error: any) {
    console.error("Error updating user permissions:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user permissions" },
      { status: 500 }
    )
  }
} 