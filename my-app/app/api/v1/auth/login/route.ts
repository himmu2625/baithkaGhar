import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/services/auth-service"
import { LoginRequest, LoginResponse } from "@/types/api"

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await req.json() as LoginRequest
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      )
    }
    
    // Attempt login
    const result = await AuthService.login(body.email, body.password)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Login failed" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during login" },
      { status: 500 }
    )
  }
}
