import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { AutoCancellationService } from '@/lib/services/auto-cancellation-service'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log("[API/admin/auto-cancel/POST] Request received")
    
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is admin
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    console.log("[API/admin/auto-cancel/POST] Admin user:", session.user.email)
    
    // Trigger automatic cancellation
    const result = await AutoCancellationService.checkAndCancelExpiredBookings()
    
    console.log("[API/admin/auto-cancel/POST] Auto-cancellation result:", result)
    
    return NextResponse.json({
      success: true,
      message: `Auto-cancellation completed. Cancelled: ${result.cancelled}, Errors: ${result.errors.length}`,
      result
    })
  } catch (error: any) {
    console.error("[API/admin/auto-cancel/POST] Error:", error)
    return NextResponse.json({ 
      error: "Auto-cancellation failed", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("[API/admin/auto-cancel/GET] Request received")
    
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is admin
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    // Get statistics about pending paid bookings
    const stats = await AutoCancellationService.getPendingPaidStats()
    
    console.log("[API/admin/auto-cancel/GET] Stats:", stats)
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error("[API/admin/auto-cancel/GET] Error:", error)
    return NextResponse.json({ 
      error: "Failed to get stats", 
      details: error.message 
    }, { status: 500 })
  }
}