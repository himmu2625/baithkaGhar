import { NextResponse, type NextRequest } from "next/server"
import { sendWelcomeEmail } from "@/lib/services/email"
import { z } from "zod"

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    
    // Validate request data
    const result = emailSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      )
    }
    
    const { email, name } = result.data
    
    // Send welcome email
    const emailSent = await sendWelcomeEmail({
      to: email,
      name,
    })
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: "Failed to send welcome email" }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: true, message: "Welcome email sent successfully" }, 
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error sending welcome email:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error sending welcome email", 
        error: error.message || "Unknown error" 
      }, 
      { status: 500 }
    )
  }
} 