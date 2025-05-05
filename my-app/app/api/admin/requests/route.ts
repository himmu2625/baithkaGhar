import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/get-session"
import dbConnect from "@/lib/db/dbConnect"
import AdminRequest from "@/models/AdminRequest"

// Mark this route as dynamic since it uses headers/cookies via getSession()
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Only admin and super_admin can view requests
    if ((session as any).user?.role !== "admin" && (session as any).user?.role !== "super_admin") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      )
    }
    
    // Connect to database
    await dbConnect()
    
    // Get all admin requests
    const requests = await AdminRequest.find()
      .sort({ createdAt: -1 }) // Newest first
    
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching admin requests:", error)
    return NextResponse.json(
      { message: "Failed to fetch admin requests" },
      { status: 500 }
    )
  }
} 