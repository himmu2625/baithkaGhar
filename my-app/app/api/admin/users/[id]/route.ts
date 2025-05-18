import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { connectMongo } from "@/lib/db/mongodb"
import User from "@/models/User"
import { PERMISSIONS } from "@/config/permissions"
import { checkPermission } from "@/lib/permissions"
import Activity from '@/models/Activity'

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
      const { name, phone, address, profileComplete, role, isAdmin, isSpam } = body
      
      // Update fields that were provided
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address
      if (profileComplete !== undefined) updateData.profileComplete = profileComplete
      if (role !== undefined) updateData.role = role
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin
      if (isSpam !== undefined) updateData.isSpam = isSpam
      
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
      
      // Log activity for spam marking
      if (isSpam !== undefined) {
        await Activity.create({
          type: 'ADMIN_ACTION',
          description: `User ${updatedUser.email} was ${isSpam ? 'marked as spam' : 'removed from spam'}`,
          entity: 'user',
          entityId: id,
          userId: token?.id || 'system',
          metadata: {
            action: isSpam ? 'MARK_USER_AS_SPAM' : 'UNMARK_USER_AS_SPAM',
            userEmail: updatedUser.email
          }
        });
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
          isSpam: updatedUser.isSpam,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
        debug: { authBypass: true }
      })
    }
    
    // Check permissions - for normal auth flow
    const hasManagePermission = token.role === "super_admin" || 
                             token.role === "admin" ||
                             await checkPermission(req, PERMISSIONS.MANAGE_USERS)
    const isCurrentUser = token.id === id
    
    console.log(`API: Permission check - hasManagePermission: ${hasManagePermission}, isCurrentUser: ${isCurrentUser}`)
    
    if (!isCurrentUser && !hasManagePermission) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }
    
    // Find target user
    const targetUser = await User.findById(id)
    
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    // Extract update fields
    const { name, phone, address, profileComplete, isSpam } = body
    
    // Update fields that were provided
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (profileComplete !== undefined) updateData.profileComplete = profileComplete
    if (isSpam !== undefined) updateData.isSpam = isSpam
    
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
    
    // Log activity for spam marking
    if (isSpam !== undefined) {
      await Activity.create({
        type: 'ADMIN_ACTION',
        description: `User ${updatedUser.email} was ${isSpam ? 'marked as spam' : 'removed from spam'}`,
        entity: 'user',
        entityId: id,
        userId: token.id,
        metadata: {
          action: isSpam ? 'MARK_USER_AS_SPAM' : 'UNMARK_USER_AS_SPAM',
          userEmail: updatedUser.email
        }
      });
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
        isSpam: updatedUser.isSpam,
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

// DELETE endpoint to permanently delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectMongo()
    
    // Get the user ID from the route params
    const { id } = params
    
    console.log(`API: Attempting to delete user with ID: ${id}, type: ${typeof id}`)
    
    // Validate token
    let token
    try {
      token = await getToken({ req, secret: authOptions.secret })
      console.log('API: Token retrieval result for user deletion:', token ? 'Token found' : 'No token found')
    } catch (tokenError) {
      console.error('API: Error retrieving token:', tokenError)
      return NextResponse.json(
        { success: false, message: "Token retrieval error", details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 401 }
      )
    }
    
    // Check if token exists and has admin rights
    if (!token || (token.role !== "super_admin" && token.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin privileges required" },
        { status: 403 }
      )
    }
    
    // Find the user to be deleted with extensive logging
    let userToDelete
    try {
      console.log(`API: Looking for user with ID: ${id}`)
      userToDelete = await User.findById(id)
      console.log(`API: User found with findById? ${!!userToDelete}`)
      
      if (!userToDelete) {
        console.log('API: User not found with findById, trying findOne')
        userToDelete = await User.findOne({ _id: id })
        console.log(`API: User found with findOne? ${!!userToDelete}`)
      }
      
      if (!userToDelete) {
        console.log('API: User not found with any query method')
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }
    } catch (findError) {
      console.error('API: Error when finding user:', findError)
      return NextResponse.json(
        { success: false, message: "Error finding user", details: findError instanceof Error ? findError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    // Protect super_admin accounts from being deleted by anyone
    if (userToDelete.role === "super_admin") {
      return NextResponse.json(
        { success: false, message: "Super admin accounts cannot be deleted" },
        { status: 403 }
      )
    }
    
    // Protect admin accounts from being deleted by anyone other than super_admin
    if (userToDelete.role === "admin" && token.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Only super admins can delete admin accounts" },
        { status: 403 }
      )
    }
    
    // Store user details for activity log before deletion
    const userEmail = userToDelete.email;
    const userName = userToDelete.name;
    
    // Delete the user
    console.log(`API: Attempting to delete user: ${userEmail}`)
    let deletedUser
    
    try {
      deletedUser = await User.findByIdAndDelete(id)
      console.log(`API: User deletion result: ${!!deletedUser ? 'Success' : 'Failure'}`)
    } catch (deleteError) {
      console.error('API: Error deleting user:', deleteError)
      return NextResponse.json(
        { success: false, message: "Error during user deletion", details: deleteError instanceof Error ? deleteError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "User deletion failed" },
        { status: 500 }
      )
    }
    
    // Log the activity
    try {
      await Activity.create({
        type: 'ADMIN_ACTION',
        description: `User ${userEmail} (${userName}) was permanently deleted`,
        entity: 'user',
        entityId: id,
        userId: token.id,
        metadata: {
          action: 'DELETE_USER',
          userEmail,
          userName
        }
      });
      console.log('API: Activity logging successful')
    } catch (activityError) {
      console.error('API: Error creating activity log:', activityError)
      // Continue despite activity log error, user is already deleted
    }
    
    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })
    
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete user" },
      { status: 500 }
    )
  }
} 