import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/services/auth-service"

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }
    
    // Send password reset email
    const result = await AuthService.sendPasswordResetEmail(body.email)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred while processing your request" },
      { status: 500 }
    )
  }
}
