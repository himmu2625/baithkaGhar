import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/services/auth-service"

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      )
    }
    
    // Verify token
    const result = await AuthService.verifyToken(body.token)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Invalid token" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during token verification" },
      { status: 500 }
    )
  }
}
