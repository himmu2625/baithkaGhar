import { NextResponse } from "next/server"
import { initializeReminderSystem } from "@/lib/services/booking-reminders"

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint for booking reminders
 * This should be called daily to send check-in reminders and checkout follow-ups
 */
export async function GET(request: Request) {
  try {
    // Verify the request is coming from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ [BookingReminders] Unauthorized cron request')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log('🔄 [BookingReminders] Starting automated reminder system...')
    
    // Initialize the reminder system
    await initializeReminderSystem()
    
    console.log('✅ [BookingReminders] Reminder system completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: "Booking reminders processed successfully",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('💥 [BookingReminders] Error in reminder system:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * Manual trigger endpoint (for testing or admin use)
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated as admin
    const { searchParams } = new URL(request.url)
    const adminSecret = searchParams.get('admin_secret')
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log('🔄 [BookingReminders] Manual trigger initiated...')
    
    // Initialize the reminder system
    await initializeReminderSystem()
    
    console.log('✅ [BookingReminders] Manual trigger completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: "Booking reminders manually triggered successfully",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('💥 [BookingReminders] Error in manual trigger:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 