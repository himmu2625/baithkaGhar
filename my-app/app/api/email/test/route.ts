import { NextResponse, type NextRequest } from "next/server"
import { sendOtpEmail, sendReactEmail, sendWelcomeEmail } from "@/lib/services/email"

export async function GET(req: NextRequest) {
  try {
    // Extract test email from query parameters or use a default
    const searchParams = req.nextUrl.searchParams
    const email = searchParams.get('email') || 'test@example.com'
    const name = searchParams.get('name') || 'Test User'
    
    // Send a test welcome email
    const emailSent = await sendWelcomeEmail({
      to: email,
      name: name,
    })
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: "Failed to send test email" }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Test email sent successfully", 
        note: "If using Ethereal, check the console for the preview URL" 
      }, 
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error sending test email:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error sending test email", 
        error: error.message || "Unknown error" 
      }, 
      { status: 500 }
    )
  }
} 

export const dynamic = "force-dynamic"