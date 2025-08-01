import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/dbConnect'
import Booking from '@/models/Booking'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log("[API/bookings/force-cancel-pending/POST] Request received")
    
    // Get session - try multiple approaches
    let session;
    let userEmail;
    let userId;
    
    try {
      // Try getSession first
      session = await getSession()
      console.log("[API/bookings/force-cancel-pending/POST] Session retrieved successfully via getSession")
      userEmail = session?.user?.email;
      userId = session?.user?.id;
    } catch (sessionError: any) {
      console.error("[API/bookings/force-cancel-pending/POST] getSession error:", sessionError)
      
      // Fallback: Try getToken
      try {
        const token = await getToken({ 
          req: req as any, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        console.log("[API/bookings/force-cancel-pending/POST] Token retrieved successfully")
        userEmail = token?.email;
        userId = token?.sub;
        console.log("[API/bookings/force-cancel-pending/POST] Using token data:", { userEmail, userId });
      } catch (tokenError: any) {
        console.error("[API/bookings/force-cancel-pending/POST] getToken error:", tokenError)
        return NextResponse.json({ 
          error: "Authentication error", 
          details: "Both getSession and getToken failed" 
        }, { status: 500 });
      }
    }
    
    if (!userEmail) {
      console.log("[API/bookings/force-cancel-pending/POST] Unauthorized - no user email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[API/bookings/force-cancel-pending/POST] User:", userEmail)
    
    // Force cancel ALL pending bookings for this user
    try {
      await dbConnect()
      
      // Find all pending bookings for this user
      const pendingBookings = await Booking.find({
        status: "pending",
        "userId.email": userEmail
      }).populate("userId", "name email").populate("propertyId", "title").lean()
      
      console.log("[API/bookings/force-cancel-pending/POST] Found", pendingBookings.length, "pending bookings for user:", userEmail)
      
      const cancelled = []
      const errors = []
      
      for (const booking of pendingBookings) {
        try {
          console.log(`[API/bookings/force-cancel-pending/POST] Force cancelling booking ${booking._id}`)
          console.log(`[API/bookings/force-cancel-pending/POST] Booking details:`, {
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt,
            dateFrom: booking.dateFrom,
            dateTo: booking.dateTo
          })
          
          // Determine cancellation reason
          const now = new Date()
          const bookingCreatedAt = new Date(booking.createdAt)
          const bookingCheckIn = new Date(booking.dateFrom)
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          let cancellationReason = "Manual force cancellation - pending booking cleanup"
          
          if (bookingCheckIn < now) {
            cancellationReason = "Manual force cancellation - past check-in date"
          } else if (bookingCreatedAt < oneHourAgo) {
            cancellationReason = "Manual force cancellation - payment timeout (1 hour)"
          } else if (bookingCreatedAt < twentyFourHoursAgo) {
            cancellationReason = "Manual force cancellation - extended payment timeout (24 hours)"
          }
          
          // Update booking status to cancelled
          const updatedBooking = await Booking.findByIdAndUpdate(
            booking._id,
            { 
              status: "cancelled",
              cancellationReason: cancellationReason,
              cancelledAt: new Date()
            },
            { new: true }
          ).populate("userId", "name email").populate("propertyId", "title").lean()
          
          if (updatedBooking) {
            cancelled.push(updatedBooking)
            console.log(`[API/bookings/force-cancel-pending/POST] Successfully cancelled booking ${booking._id} with reason: ${cancellationReason}`)
          } else {
            errors.push(`Failed to update booking ${booking._id}`)
            console.error(`[API/bookings/force-cancel-pending/POST] Failed to update booking ${booking._id}`)
          }
        } catch (error: any) {
          const errorMsg = `Error cancelling booking ${booking._id}: ${error.message}`
          errors.push(errorMsg)
          console.error(`[API/bookings/force-cancel-pending/POST] ${errorMsg}`)
        }
      }
      
      console.log(`[API/bookings/force-cancel-pending/POST] Force cancellation complete. Cancelled: ${cancelled.length}, Errors: ${errors.length}`)
      
      return NextResponse.json({
        success: true,
        message: `Force cancellation completed. Cancelled: ${cancelled.length}, Errors: ${errors.length}`,
        result: {
          cancelled: cancelled.length,
          errors,
          cancelledBookings: cancelled
        }
      })
    } catch (error: any) {
      console.error("[API/bookings/force-cancel-pending/POST] Force cancellation error:", error)
      return NextResponse.json({ 
        error: "Force cancellation failed", 
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[API/bookings/force-cancel-pending/POST] Outer error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}