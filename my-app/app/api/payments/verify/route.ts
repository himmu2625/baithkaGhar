import { NextRequest, NextResponse } from "next/server"

import { verifyPaymentSignature, getPaymentDetails as getPayment } from "@/lib/services/razorpay"
import { getSession } from "@/lib/get-session"
import { z } from "zod"
import Booking from "@/models/Booking"
import dbConnect from "@/lib/db/dbConnect"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// Payment verification schema
const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
})

export async function POST(req: Request) {
  try {
    // Check user authentication
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Ensure database connection
    await dbConnect()
    
    // Parse and validate request body
    const body = await req.json()
    console.log("[PaymentVerify] Request body received:", body)
    
    const result = verifyPaymentSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    
    const { bookingId, orderId, paymentId, signature } = result.data
    
    // Get the booking
    const booking = await Booking.findById(bookingId)
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    // Verify the user owns this booking
    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Verify the payment signature
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    })
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }
    
    // Get payment details
    const payment = await getPayment(paymentId)
    
    // Check payment status
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${payment.status}` },
        { status: 400 }
      )
    }
    
    // Update booking with payment information
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: "paid",
      paymentId: paymentId,
      paymentMethod: "razorpay",
      paymentDate: new Date(),
      status: "confirmed", // Automatically confirm the booking
    })
    
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      bookingId,
      paymentId,
    })
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
} 