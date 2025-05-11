import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db/dbConnect"
import AdminRequest from "@/models/AdminRequest"
import User from "@/models/User"
import { sendReactEmail } from "@/lib/services/email"
import { getToken } from "next-auth/jwt"
import { getDefaultPermissions } from "@/config/permissions"
import { PERMISSIONS } from "@/config/permissions"
import { checkPermission } from "@/lib/permissions"
import mongoose from "mongoose"

// Ensure this route is always dynamically rendered
export const dynamic = 'force-dynamic';

// Define the session type with the user role
interface SessionUser {
  name: string;
  email: string;
  id: string;
  role: string;
  image?: string;
}

interface Session {
  user: SessionUser;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { action, notes } = body
    
    // Validate the action
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      )
    }
    
    // Get the current token
    const token = await getToken({ 
      req, 
      secret: authOptions.secret 
    })
    
    if (!token || !token.id || !token.role) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Create a session-like object from token
    const session = {
      user: {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as string,
      }
    } as Session
    
    // Check permissions - only super_admin can approve requests
    // or admins with the specific permission
    const hasApprovalPermission = await checkPermission(req, PERMISSIONS.APPROVE_ADMIN);
    
    if (session.user.role !== "super_admin" && !hasApprovalPermission) {
      return NextResponse.json(
        { message: "Forbidden: You don't have permission to review admin requests" },
        { status: 403 }
      )
    }
    
    // Connect to DB
    await dbConnect()
    
    // Get the admin request
    const adminRequest = await AdminRequest.findById(id)
    if (!adminRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      )
    }
    
    // Only super_admin can approve super_admin requests
    if (adminRequest.requestedRole === "super_admin" && session.user.role !== "super_admin") {
      return NextResponse.json(
        { message: "Only Super Admins can approve Super Admin requests" },
        { status: 403 }
      )
    }
    
    if (action === "approve") {
      // Check if user already exists
      const existingUser = await User.findOne({ email: adminRequest.email });
      
      if (existingUser) {
        // Update existing user with admin privileges
        existingUser.role = adminRequest.requestedRole;
        existingUser.isAdmin = true;
        existingUser.permissions = getDefaultPermissions(adminRequest.requestedRole);
        await existingUser.save();
        
        // Update the admin request
        adminRequest.status = "approved";
        adminRequest.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
        adminRequest.reviewDate = new Date();
        adminRequest.reviewNotes = notes || "Approved by administrator";
        await adminRequest.save();
        
        // Send approval email
        try {
          await sendReactEmail({
            to: adminRequest.email,
            subject: "Your Admin Access Request Has Been Approved",
            emailComponent: {
              name: adminRequest.fullName,
              role: adminRequest.requestedRole
            }
          })
        } catch (error) {
          console.error("Failed to send approval email:", error)
        }
        
        return NextResponse.json({ 
          message: "Admin request approved for existing user", 
          userId: existingUser._id 
        });
      } else {
        // Create a new user with admin privileges
        const newUser = await User.create({
          name: adminRequest.fullName,
          email: adminRequest.email,
          password: adminRequest.password, // Already hashed in the request model
          phone: adminRequest.phone,
          role: adminRequest.requestedRole,
          isAdmin: true,
          permissions: getDefaultPermissions(adminRequest.requestedRole),
          profileComplete: true,
          isEmailVerified: true, // Auto-verify email since it's admin-approved
        });
        
        // Update the admin request
        adminRequest.status = "approved";
        adminRequest.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
        adminRequest.reviewDate = new Date();
        adminRequest.reviewNotes = notes || "Approved by administrator";
        await adminRequest.save();
        
        // Send approval email
        try {
          await sendReactEmail({
            to: adminRequest.email,
            subject: "Your Admin Access Request Has Been Approved",
            emailComponent: {
              name: adminRequest.fullName,
              role: adminRequest.requestedRole
            }
          })
        } catch (error) {
          console.error("Failed to send approval email:", error)
        }
        
        return NextResponse.json({ 
          message: "Admin request approved and new user created", 
          userId: newUser._id 
        });
      }
    } else {
      // Reject the request
      adminRequest.status = "rejected";
      adminRequest.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
      adminRequest.reviewDate = new Date();
      adminRequest.reviewNotes = notes || "Rejected by administrator";
      await adminRequest.save();
      
      // Send rejection email
      try {
        await sendReactEmail({
          to: adminRequest.email,
          subject: "Your Admin Access Request Has Been Rejected",
          emailComponent: {
            name: adminRequest.fullName,
            notes: notes || "Your request has been reviewed and was not approved at this time."
          }
        })
      } catch (error) {
        console.error("Failed to send rejection email:", error)
      }
      
      return NextResponse.json({ 
        message: "Admin request rejected" 
      });
    }
    
  } catch (error) {
    console.error("Error reviewing admin request:", error)
    return NextResponse.json(
      { message: "Failed to process request" },
      { status: 500 }
    )
  }
} 