import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/services/auth-service"
import { RegisterRequest, RegisterResponse } from "@/types/api"

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    const body = await req.json() as RegisterRequest
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }
    
    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }
    
    // Attempt registration
    const result = await AuthService.register(body)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Registration failed" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during registration" },
      { status: 500 }
    )
  }
}
