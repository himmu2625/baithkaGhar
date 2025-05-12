import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { connectMongo } from "@/lib/db/mongodb"
import User from "@/models/User"
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
    await connectMongo()
    
    // Get the user ID from the route params
    const { id } = params
    
    console.log(`API: Fetching user details for ID: ${id}`)
    
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
        },
        debug: { authBypass: true }
      })
    }
    
    // Check permissions
    const hasViewPermission = token.role === "super_admin" || 
                              token.role === "admin" || 
                              await checkPermission(req, PERMISSIONS.VIEW_USERS)
    const isCurrentUser = token.id === id
    
    console.log(`API: Permission check - hasViewPermission: ${hasViewPermission}, isCurrentUser: ${isCurrentUser}`)
    
    if (!isCurrentUser && !hasViewPermission) {
      return NextResponse.json(
        { success: false, message: "Forbidden", debug: { token: { id: token.id, role: token.role } } },
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
      { success: false, message: error.message || "Failed to fetch user", stack: error.stack },
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
    await connectMongo()
    
    // Get the user ID from the route params
    const { id } = params
    
    console.log(`API: Updating user details for ID: ${id}`)
    
    // Validate token
    let token
    try {
      token = await getToken({ req, secret: authOptions.secret })
      console.log('API: Token retrieval result for update:', token ? 'Token found' : 'No token found')
    } catch (tokenError) {
      console.error('API: Error retrieving token for update:', tokenError)
      return NextResponse.json(
        { success: false, message: "Token retrieval error", details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 401 }
      )
    }
    
    // Parse request body early to log what changes are being attempted
    const body = await req.json()
    console.log('API: Update request body:', JSON.stringify(body, null, 2))
    
    // For debugging purposes, temporarily allow updates without authentication
    // TODO: Remove this in production
    let bypassAuth = true
    if (bypassAuth || !token || !token.id) {
      console.log('API: No valid token found for update, but proceeding for debugging')
      
      // Find the target user
      const targetUser = await User.findById(id)
      
      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }
      
      // Extract update fields
      const { name, phone, address, profileComplete, role, isAdmin } = body
      
      // Update fields that were provided
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address
      if (profileComplete !== undefined) updateData.profileComplete = profileComplete
      if (role !== undefined) updateData.role = role
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin
      
      console.log('API: Applying updates with auth bypass:', updateData)
      
      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).select("-password")
      
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: "User update failed" },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: "User updated successfully (auth bypass)",
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
        },
        debug: { authBypass: true }
      })
    }
    
    // Normal flow with authentication continues below
    // Check if user can edit this user
    const hasEditPermission = token.role === "super_admin" || 
                             await checkPermission(req, PERMISSIONS.EDIT_USER)
    const isCurrentUser = token.id === id
    
    console.log(`API: Edit permission check - hasEditPermission: ${hasEditPermission}, isCurrentUser: ${isCurrentUser}`)
    
    if (!isCurrentUser && !hasEditPermission) {
      return NextResponse.json(
        { success: false, message: "Forbidden", debug: { token: { id: token.id, role: token.role } } },
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
    
    // Extract fields from the already parsed body
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
    
    console.log('API: Applying normal authenticated updates:', updateData)
    
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
      { success: false, message: error.message || "Failed to update user", stack: error.stack },
      { status: 500 }
    )
  }
} 