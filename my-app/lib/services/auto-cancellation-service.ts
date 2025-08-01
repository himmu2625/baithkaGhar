import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import { convertDocToObject } from "@/lib/db"

/**
 * Service to handle automatic cancellation of pending paid bookings
 */
export const AutoCancellationService = {
  /**
   * Check and cancel expired pending paid bookings
   * @returns {Promise<{cancelled: number, errors: string[]}>}
   */
  checkAndCancelExpiredBookings: async () => {
    try {
      await dbConnect()
      
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      console.log("[AutoCancellationService] Checking for expired pending paid bookings...")
      console.log("[AutoCancellationService] Current time:", now.toISOString())
      console.log("[AutoCancellationService] Cutoff time:", twentyFourHoursAgo.toISOString())
      
      // Find pending paid bookings that were created more than 24 hours ago
      const expiredBookings = await Booking.find({
        status: "pending",
        paymentStatus: "paid",
        createdAt: { $lt: twentyFourHoursAgo }
      }).populate("userId", "name email").populate("propertyId", "title").lean()
      
      console.log("[AutoCancellationService] Found", expiredBookings.length, "expired pending paid bookings")
      
      const cancelled = []
      const errors = []
      
      for (const booking of expiredBookings) {
        try {
          console.log(`[AutoCancellationService] Cancelling booking ${booking._id} for user ${booking.userId?.email}`)
          
          // Update booking status to cancelled
          const updatedBooking = await Booking.findByIdAndUpdate(
            booking._id,
            { 
              status: "cancelled",
              cancellationReason: "Automatic cancellation - payment deadline expired",
              cancelledAt: new Date()
            },
            { new: true }
          ).populate("userId", "name email").populate("propertyId", "title").lean()
          
          if (updatedBooking) {
            cancelled.push(updatedBooking)
            console.log(`[AutoCancellationService] Successfully cancelled booking ${booking._id}`)
          } else {
            errors.push(`Failed to update booking ${booking._id}`)
            console.error(`[AutoCancellationService] Failed to update booking ${booking._id}`)
          }
        } catch (error: any) {
          const errorMsg = `Error cancelling booking ${booking._id}: ${error.message}`
          errors.push(errorMsg)
          console.error(`[AutoCancellationService] ${errorMsg}`)
        }
      }
      
      console.log(`[AutoCancellationService] Cancellation complete. Cancelled: ${cancelled.length}, Errors: ${errors.length}`)
      
      return {
        cancelled: cancelled.length,
        errors,
        cancelledBookings: cancelled.map(booking => convertDocToObject(booking))
      }
    } catch (error: any) {
      console.error("[AutoCancellationService] Error in checkAndCancelExpiredBookings:", error)
      throw error
    }
  },
  
  /**
   * Check and cancel expired pending bookings for a specific user
   * @param {string} userEmail - The user's email
   * @returns {Promise<{cancelled: number, errors: string[]}>}
   */
  checkAndCancelExpiredBookingsForUser: async (userEmail: string) => {
    try {
      await dbConnect()
      
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago for payment timeout
      
      console.log("[AutoCancellationService] Checking for expired pending bookings for user:", userEmail)
      console.log("[AutoCancellationService] Current time:", now.toISOString())
      console.log("[AutoCancellationService] 24h cutoff time:", twentyFourHoursAgo.toISOString())
      console.log("[AutoCancellationService] 1h cutoff time:", oneHourAgo.toISOString())
      
      // Find pending bookings that should be cancelled:
      // 1. Pending bookings older than 1 hour (payment timeout)
      // 2. Pending bookings older than 24 hours (extended timeout)
      // 3. Pending bookings past their check-in date
      
      const paymentTimeoutBookings = await Booking.find({
        status: "pending",
        createdAt: { $lt: oneHourAgo },
        "userId.email": userEmail
      }).populate("userId", "name email").populate("propertyId", "title").lean()
      
      const extendedTimeoutBookings = await Booking.find({
        status: "pending",
        createdAt: { $lt: twentyFourHoursAgo },
        "userId.email": userEmail
      }).populate("userId", "name email").populate("propertyId", "title").lean()
      
      const pastCheckInBookings = await Booking.find({
        status: "pending",
        dateFrom: { $lt: now.toISOString().split('T')[0] }, // Check-in date is in the past
        "userId.email": userEmail
      }).populate("userId", "name email").populate("propertyId", "title").lean()
      
      console.log("[AutoCancellationService] Found", paymentTimeoutBookings.length, "pending bookings with payment timeout (1h) for user:", userEmail)
      console.log("[AutoCancellationService] Found", extendedTimeoutBookings.length, "pending bookings with extended timeout (24h) for user:", userEmail)
      console.log("[AutoCancellationService] Found", pastCheckInBookings.length, "pending bookings with past check-in dates for user:", userEmail)
      
      // Combine all bookings to cancel and remove duplicates
      const allBookingsToCancel = [...paymentTimeoutBookings, ...extendedTimeoutBookings, ...pastCheckInBookings]
      const uniqueBookingsToCancel = allBookingsToCancel.filter((booking, index, self) => 
        index === self.findIndex(b => b._id.toString() === booking._id.toString())
      )
      
      console.log("[AutoCancellationService] Total unique bookings to cancel:", uniqueBookingsToCancel.length)
      
      const cancelled = []
      const errors = []
      
      for (const booking of uniqueBookingsToCancel) {
        try {
          console.log(`[AutoCancellationService] Cancelling booking ${booking._id} for user ${booking.userId?.email}`)
          console.log(`[AutoCancellationService] Booking details:`, {
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt,
            dateFrom: booking.dateFrom,
            dateTo: booking.dateTo
          })
          
          // Determine cancellation reason based on the condition
          let cancellationReason = "Automatic cancellation - payment timeout"
          const bookingCreatedAt = new Date(booking.createdAt)
          const bookingCheckIn = new Date(booking.dateFrom)
          
          if (bookingCheckIn < now) {
            cancellationReason = "Automatic cancellation - past check-in date"
          } else if (bookingCreatedAt < oneHourAgo) {
            cancellationReason = "Automatic cancellation - payment timeout (1 hour)"
          } else if (bookingCreatedAt < twentyFourHoursAgo) {
            cancellationReason = "Automatic cancellation - extended payment timeout (24 hours)"
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
            console.log(`[AutoCancellationService] Successfully cancelled booking ${booking._id} with reason: ${cancellationReason}`)
          } else {
            errors.push(`Failed to update booking ${booking._id}`)
            console.error(`[AutoCancellationService] Failed to update booking ${booking._id}`)
          }
        } catch (error: any) {
          const errorMsg = `Error cancelling booking ${booking._id}: ${error.message}`
          errors.push(errorMsg)
          console.error(`[AutoCancellationService] ${errorMsg}`)
        }
      }
      
      console.log(`[AutoCancellationService] Cancellation complete for user ${userEmail}. Cancelled: ${cancelled.length}, Errors: ${errors.length}`)
      
      return {
        cancelled: cancelled.length,
        errors,
        cancelledBookings: cancelled.map(booking => convertDocToObject(booking))
      }
    } catch (error: any) {
      console.error("[AutoCancellationService] Error in checkAndCancelExpiredBookingsForUser:", error)
      throw error
    }
  },
  
  /**
   * Get statistics about pending paid bookings
   * @returns {Promise<{total: number, expired: number, recent: number}>}
   */
  getPendingPaidStats: async () => {
    try {
      await dbConnect()
      
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const total = await Booking.countDocuments({
        status: "pending",
        paymentStatus: "paid"
      })
      
      const expired = await Booking.countDocuments({
        status: "pending",
        paymentStatus: "paid",
        createdAt: { $lt: twentyFourHoursAgo }
      })
      
      const recent = await Booking.countDocuments({
        status: "pending",
        paymentStatus: "paid",
        createdAt: { $gte: twentyFourHoursAgo }
      })
      
      return { total, expired, recent }
    } catch (error: any) {
      console.error("[AutoCancellationService] Error in getPendingPaidStats:", error)
      throw error
    }
  }
}