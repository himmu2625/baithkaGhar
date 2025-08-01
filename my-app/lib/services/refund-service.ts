import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"
import { convertDocToObject } from "@/lib/db"

/**
 * Service to handle refunds for cancelled bookings
 */
export const RefundService = {
  /**
   * Process refund for a cancelled booking
   * @param {string} bookingId - The booking ID
   * @param {string} userId - The user ID who cancelled the booking
   * @returns {Promise<{success: boolean, refundAmount?: number, message: string, instructions?: string}>}
   */
  processRefund: async (bookingId: string, userId: string) => {
    try {
      await dbConnect()
      
      console.log("[RefundService] Processing refund for booking:", bookingId)
      
      // Find the booking with payment details
      const booking = await Booking.findById(bookingId)
        .populate("userId", "name email")
        .populate("propertyId", "title")
        .lean()
      
      if (!booking) {
        console.error("[RefundService] Booking not found:", bookingId)
        return {
          success: false,
          message: "Booking not found"
        }
      }
      
      console.log("[RefundService] Found booking:", {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        totalPrice: booking.totalPrice,
        paymentId: booking.paymentId,
        paymentSessionId: booking.paymentSessionId
      })
      
      // Check if payment was made
      if (booking.paymentStatus !== "paid" && booking.paymentStatus !== "completed") {
        console.log("[RefundService] No payment to refund - payment status:", booking.paymentStatus)
        return {
          success: true,
          message: "No payment to refund",
          refundAmount: 0
        }
      }
      
      // Check if refund was already processed
      if (booking.paymentStatus === "refunded") {
        console.log("[RefundService] Refund already processed")
        return {
          success: true,
          message: "Refund already processed",
          refundAmount: booking.totalPrice
        }
      }
      
      const refundAmount = booking.totalPrice || 0
      
      if (refundAmount <= 0) {
        console.log("[RefundService] No amount to refund")
        return {
          success: true,
          message: "No amount to refund",
          refundAmount: 0
        }
      }
      
      // Process refund through payment gateway (Razorpay)
      let refundResult = null
      if (booking.paymentId) {
        try {
          console.log("[RefundService] Processing refund through Razorpay for payment:", booking.paymentId)
          
          // Call Razorpay refund API
          const razorpay = require('razorpay')
          const instance = new razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          })
          
          const refund = await instance.payments.refund(booking.paymentId, {
            amount: refundAmount * 100, // Razorpay expects amount in paise
            speed: 'normal', // or 'optimum'
            notes: {
              reason: 'Booking cancellation',
              booking_id: booking._id.toString(),
              cancelled_by: userId
            }
          })
          
          console.log("[RefundService] Razorpay refund successful:", refund.id)
          refundResult = refund
          
        } catch (razorpayError: any) {
          console.error("[RefundService] Razorpay refund failed:", razorpayError)
          
          // If Razorpay refund fails, we'll still mark it as refunded in our system
          // and provide manual refund instructions
          console.log("[RefundService] Proceeding with manual refund process")
        }
      }
      
      // Update booking with refund information
      const updateData: any = {
        paymentStatus: "refunded",
        refundAmount: refundAmount,
        refundedAt: new Date(),
        refundReason: "Booking cancellation",
        cancelledBy: userId
      }
      
      if (refundResult) {
        updateData.refundId = refundResult.id
        updateData.refundStatus = "completed"
      } else {
        updateData.refundStatus = "pending"
        updateData.refundNotes = "Manual refund required - payment gateway refund failed"
      }
      
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { $set: updateData },
        { new: true }
      ).populate("userId", "name email").populate("propertyId", "title").lean()
      
      if (!updatedBooking) {
        console.error("[RefundService] Failed to update booking with refund info")
        return {
          success: false,
          message: "Failed to update booking with refund information"
        }
      }
      
      console.log("[RefundService] Refund processed successfully:", {
        bookingId: updatedBooking._id,
        refundAmount,
        refundStatus: updateData.refundStatus
      })
      
      // Generate refund instructions
      const instructions = RefundService.generateRefundInstructions(
        updatedBooking,
        refundResult,
        updateData.refundStatus
      )
      
      return {
        success: true,
        refundAmount,
        message: refundResult 
          ? "Refund processed successfully" 
          : "Refund initiated - manual processing required",
        instructions,
        refundStatus: updateData.refundStatus,
        refundId: refundResult?.id
      }
      
    } catch (error: any) {
      console.error("[RefundService] Error processing refund:", error)
      return {
        success: false,
        message: "Failed to process refund",
        error: error.message
      }
    }
  },
  
  /**
   * Generate refund instructions for the user
   */
  generateRefundInstructions: (booking: any, refundResult: any, refundStatus: string) => {
    const refundAmount = booking.totalPrice || 0
    const bookingCode = `BK-${booking._id.toString().slice(-6).toUpperCase()}`
    
    if (refundStatus === "completed" && refundResult) {
      return {
        title: "Refund Processed Successfully",
        message: `Your refund of ₹${refundAmount.toLocaleString()} has been processed successfully.`,
        details: [
          `Booking Code: ${bookingCode}`,
          `Refund Amount: ₹${refundAmount.toLocaleString()}`,
          `Refund ID: ${refundResult.id}`,
          `Processing Time: 3-5 business days`,
          `Refund Method: Original payment method`
        ],
        timeline: [
          "Refund initiated immediately",
          "Bank processing: 1-2 business days",
          "Credit to your account: 3-5 business days"
        ]
      }
    } else {
      return {
        title: "Refund Initiated",
        message: `Your refund of ₹${refundAmount.toLocaleString()} has been initiated.`,
        details: [
          `Booking Code: ${bookingCode}`,
          `Refund Amount: ₹${refundAmount.toLocaleString()}`,
          `Status: Manual processing required`,
          `Expected Time: 5-7 business days`,
          `Contact: support@baithaka.com for assistance`
        ],
        timeline: [
          "Refund request submitted",
          "Manual verification: 1-2 business days",
          "Bank processing: 2-3 business days",
          "Credit to your account: 5-7 business days"
        ],
        contactInfo: {
          email: "support@baithaka.com",
          phone: "+91-XXXXXXXXXX",
          hours: "24/7 Support"
        }
      }
    }
  },
  
  /**
   * Get refund status for a booking
   */
  getRefundStatus: async (bookingId: string) => {
    try {
      await dbConnect()
      
      const booking = await Booking.findById(bookingId)
        .select("paymentStatus refundAmount refundedAt refundStatus refundId")
        .lean()
      
      if (!booking) {
        return null
      }
      
      return {
        paymentStatus: booking.paymentStatus,
        refundAmount: booking.refundAmount,
        refundedAt: booking.refundedAt,
        refundStatus: booking.refundStatus,
        refundId: booking.refundId
      }
    } catch (error: any) {
      console.error("[RefundService] Error getting refund status:", error)
      return null
    }
  }
}