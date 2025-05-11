import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db/dbConnect"
import User from "@/models/User"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { PERMISSIONS } from "@/config/permissions"
import { checkPermission } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// GET endpoint to fetch a user's details
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
    const hasViewPermission = token.role === "super_admin" || 
                              token.role === "admin" || 
                              await checkPermission(req, PERMISSIONS.VIEW_USERS)
    const isCurrentUser = token.id === id
    
    if (!isCurrentUser && !hasViewPermission) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }
    
    // Find the user and exclude password
    const user = await User.findById(id).select("-password")
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || (user.isAdmin ? "admin" : "user"),
        isAdmin: user.isAdmin,
        phone: user.phone,
        address: user.address,
        profileComplete: user.profileComplete,
        permissions: user.permissions || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
    
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user" },
      { status: 500 }
    )
  }
}

// PUT endpoint to update a user's details
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
    
    // Check if user can edit this user
    const hasEditPermission = token.role === "super_admin" || 
                              await checkPermission(req, PERMISSIONS.EDIT_USER)
    const isCurrentUser = token.id === id
    
    if (!isCurrentUser && !hasEditPermission) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }
    
    // Find the target user
    const targetUser = await User.findById(id)
    
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    // Non-super admins can't edit super admins
    if (targetUser.role === "super_admin" && token.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Only super admins can edit other super admins" },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await req.json()
    const { name, phone, address, profileComplete } = body
    
    // Update fields that were provided
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (profileComplete !== undefined) updateData.profileComplete = profileComplete
    
    // Only super admin can update role and admin status
    if (token.role === "super_admin") {
      if (body.role !== undefined) updateData.role = body.role
      if (body.isAdmin !== undefined) updateData.isAdmin = body.isAdmin
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password")
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role || (updatedUser.isAdmin ? "admin" : "user"),
        isAdmin: updatedUser.isAdmin,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileComplete: updatedUser.profileComplete,
        permissions: updatedUser.permissions || [],
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }
    })
    
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
} 