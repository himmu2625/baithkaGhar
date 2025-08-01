import { NextRequest, NextResponse } from "next/server"

import { createOrder, verifyPaymentSignature } from "@/lib/services/razorpay"
import { getSession } from "@/lib/get-session"
import { z } from "zod"
import { PropertyService } from "@/services/property-service"
import Booking from "@/models/Booking"
import dbConnect from "@/lib/db/dbConnect"
import Property from "@/models/Property"

// Checkout session request schema
const checkoutSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  propertyId: z.string().min(1, "Property ID is required"),
  returnUrl: z.string().url("Valid return URL is required"),
})

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

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
    console.log("[PaymentCheckout] Request body received:", body)
    
    const result = checkoutSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    
    const { bookingId, propertyId, returnUrl } = result.data
    
    // Get the booking
    const booking = await Booking.findById(bookingId)
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    // Verify the user owns this booking
    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Get the property details
    const property = await PropertyService.getPropertyById(propertyId)
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    // Create a Razorpay order
    const order = await createOrder({
      amount: booking.totalPrice,
      currency: 'INR',
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        propertyId: propertyId,
        propertyName: property.title,
        guestName: session.user.name || '',
        email: session.user.email || '',
      }
    })
    
    // Update booking with order ID
    await Booking.findByIdAndUpdate(bookingId, {
      paymentSessionId: order.id,
      paymentStatus: "pending",
    })
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      description: `Booking for ${property.title}`,
      notes: {
        bookingId: bookingId,
        propertyId: propertyId,
        userId: session.user.id,
      }
    })
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    )
  }
} 