import { NextResponse } from "next/server"
import { verifyPaymentSignature } from "@/lib/services/razorpay"
import { dbHandler } from "@/lib/db"
import Booking from "@/models/Booking"
import { headers } from "next/headers"
import crypto from 'crypto'

// This endpoint receives webhook events from Razorpay
export const POST = dbHandler(async (req: Request) => {
  try {
    // Get the request body
    const payload = await req.json()
    
    // Get the Razorpay signature from headers
    const headersList = headers()
    const signature = headersList.get("x-razorpay-signature")
    
    if (!signature) {
      return NextResponse.json({ error: "Missing Razorpay signature" }, { status: 400 })
    }
    
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }
    
    // Create a signature using the payload and the webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex')
    
    // Compare signatures
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
    
    // Extract the event and handle it based on the event type
    const event = payload.event
    
    switch (event) {
      case "payment.authorized": {
        // Payment was authorized but not yet captured
        const payment = payload.payload.payment.entity
        const notes = payment.notes
        
        if (notes && notes.bookingId) {
          // Update the booking with payment information
          await Booking.findByIdAndUpdate(notes.bookingId, {
            paymentStatus: "paid",
            paymentId: payment.id,
            paymentMethod: "razorpay",
            paymentDate: new Date(),
            status: "confirmed", // Automatically confirm the booking
          })
        }
        
        break
      }
      
      case "payment.captured": {
        // Payment was successfully captured
        const payment = payload.payload.payment.entity
        const notes = payment.notes
        
        if (notes && notes.bookingId) {
          // Update the booking with payment information
          await Booking.findByIdAndUpdate(notes.bookingId, {
            paymentStatus: "paid",
            paymentId: payment.id,
            paymentMethod: "razorpay",
            paymentDate: new Date(),
            status: "confirmed", // Automatically confirm the booking
          })
        }
        
        break
      }
      
      case "payment.failed": {
        // Payment failed
        const payment = payload.payload.payment.entity
        const notes = payment.notes
        
        if (notes && notes.bookingId) {
          // Update the booking status
          await Booking.findByIdAndUpdate(notes.bookingId, {
            paymentStatus: "failed",
          })
        }
        
        break
      }
      
      case "refund.created": {
        // Refund was initiated
        const refund = payload.payload.refund.entity
        const payment = refund.payment_id
        
        // Find the booking with this payment ID
        const booking = await Booking.findOne({ paymentId: payment })
        
        if (booking) {
          await Booking.findByIdAndUpdate(booking._id, {
            paymentStatus: "refunded",
            status: "cancelled", // Mark booking as cancelled
            cancelledAt: new Date(),
          })
        }
        
        break
      }
      
      // Handle other events if needed
      default:
        console.log(`Unhandled event type: ${event}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 400 }
    )
  }
}) 