import { NextResponse } from "next/server"
import { PaymentService } from "@/lib/services/payment-service"
import { getSession } from "@/lib/get-session"
import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"

/**
 * POST /api/payments/verify
 * Verify payment signature and confirm booking
 */
export async function POST(req: Request) {
  try {
    console.log("[API/payments/verify] Payment verification request received")

    // Get session
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body

    console.log("[API/payments/verify] Verification data:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      bookingId
    })

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      )
    }

    // Process payment success through PaymentService
    const result = await PaymentService.processPaymentSuccess(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!result.success) {
      console.error("[API/payments/verify] Payment verification failed:", result.errorDescription)
      return NextResponse.json(
        {
          success: false,
          error: result.errorDescription || "Payment verification failed"
        },
        { status: 400 }
      )
    }

    console.log("[API/payments/verify] Payment verified successfully")

    // Get the updated booking
    await dbConnect()
    const bookingDoc = await Booking.findById(bookingId)
      .populate("propertyId", "title address images")
      .lean()

    if (!bookingDoc) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Type assertion for the booking document
    const booking = bookingDoc as any

    console.log("[API/payments/verify] Booking status:", {
      id: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed successfully",
      booking: {
        id: booking._id?.toString() || booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalPrice: booking.totalPrice,
        property: booking.propertyId
      }
    })

  } catch (error: any) {
    console.error("[API/payments/verify] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed"
      },
      { status: 500 }
    )
  }
}
