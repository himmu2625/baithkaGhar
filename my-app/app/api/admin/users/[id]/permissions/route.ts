import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

import { authOptions } from "@/lib/auth"
import { connectMongo } from "@/lib/db/mongodb"
import User from "@/models/User"
import { checkPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/config/permissions"

export const dynamic = 'force-dynamic'

// GET endpoint to fetch a user's permissions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectMongo()
    
    // Get the user ID from the route params
    const { id } = params
    
    console.log(`API: Fetching permissions for user ID: ${id}`)
    
    // Validate token
    let token
    try {
      token = await getToken({ req, secret: authOptions.secret })
      console.log('API: Token retrieval result:', token ? 'Token found' : 'No token found')
    } catch (tokenError) {
      console.error('API: Error retrieving token:', tokenError)
      return NextResponse.json(
        { success: false, message: "Token retrieval error", details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 401 }
      )
    }
    
    // For debugging purposes, temporarily allow access without authentication
    // TODO: Remove this in production
    if (!token || !token.id) {
      console.log('API: No valid token found, but proceeding for debugging')
      // Find the user directly
      const user = await User.findById(id)
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        permissions: user.permissions || [],
        debug: { authBypass: true }
      })
    }
    
    // Check permissions
    const hasViewPermission = await checkPermission(req, PERMISSIONS.VIEW_ADMINS)
    const isCurrentUser = token.id === id
    
    console.log(`API: Permission check - hasViewPermission: ${hasViewPermission}, isCurrentUser: ${isCurrentUser}`)
    
    if (!isCurrentUser && (token.role !== "super_admin" && !hasViewPermission)) {
      return NextResponse.json(
        { success: false, message: "Forbidden", debug: { token: { id: token.id, role: token.role } } },
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
      { success: false, message: error.message || "Failed to fetch user permissions", stack: error.stack },
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
    await connectMongo()
    
    // Get the user ID from the route params
    const { id } = params
    
    console.log(`API: Updating permissions for user ID: ${id}`)
    
    // Parse request body early to log what changes are being attempted
    const body = await req.json()
    console.log('API: Update permissions request body:', JSON.stringify(body, null, 2))
    
    // Validate token
    let token
    try {
      token = await getToken({ req, secret: authOptions.secret })
      console.log('API: Token retrieval result for permission update:', token ? 'Token found' : 'No token found')
    } catch (tokenError) {
      console.error('API: Error retrieving token for permission update:', tokenError)
      return NextResponse.json(
        { success: false, message: "Token retrieval error", details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 401 }
      )
    }
    
    // For debugging purposes, temporarily allow updates without authentication
    // TODO: Remove this in production
    let bypassAuth = true
    if (bypassAuth || !token || !token.id) {
      console.log('API: No valid token found for permissions update, but proceeding for debugging')
      
      const { permissions } = body
      
      if (!permissions || !Array.isArray(permissions)) {
        return NextResponse.json(
          { success: false, message: "Permissions array is required" },
          { status: 400 }
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
      
      // For super_admin users, don't modify permissions (they should always have full access)
      if (user.role === "super_admin") {
        return NextResponse.json({
          success: false,
          message: "Cannot modify permissions for super admin users"
        }, { status: 400 })
      }
      
      // Validate the provided permissions
      const allPermissions = Object.values(PERMISSIONS)
      const invalidPermissions = permissions.filter(perm => !allPermissions.includes(perm))
      
      if (invalidPermissions.length > 0) {
        return NextResponse.json({
          success: false,
          message: `Invalid permissions: ${invalidPermissions.join(", ")}`
        }, { status: 400 })
      }
      
      // Update the user's permissions
      user.permissions = permissions
      await user.save()
      
      return NextResponse.json({
        success: true,
        message: "Permissions updated successfully (auth bypass)",
        permissions: user.permissions,
        debug: { authBypass: true }
      })
    }
    
    // Normal flow with authentication continues below
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
    
    // Use the already parsed request body
    const { permissions } = body
    
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: "Permissions array is required" },
        { status: 400 }
      )
    }
    
    // Find the user and update permissions
    const user = await User.findById(id)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    // For super_admin users, don't modify permissions (they should always have full access)
    if (user.role === "super_admin") {
      return NextResponse.json({
        success: false,
        message: "Cannot modify permissions for super admin users"
      }, { status: 400 })
    }
    
    // Validate the provided permissions
    const allPermissions = Object.values(PERMISSIONS)
    const invalidPermissions = permissions.filter(perm => !allPermissions.includes(perm))
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Invalid permissions: ${invalidPermissions.join(", ")}`
      }, { status: 400 })
    }
    
    // Update the user's permissions
    user.permissions = permissions
    await user.save()
    
    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
      permissions: user.permissions
    })
    
  } catch (error: any) {
    console.error("Error updating user permissions:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user permissions" },
      { status: 500 }
    )
  }
} 