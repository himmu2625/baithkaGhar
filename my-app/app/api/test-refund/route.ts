import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/get-session"
import { RefundService } from "@/lib/services/refund-service"
import dbConnect from "@/lib/db/dbConnect"
import Booking from "@/models/Booking"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only allow admin users to test refund functionality
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    await dbConnect()

    // Find a booking with payment status "paid" for testing
    const testBooking = await Booking.findOne({ 
      paymentStatus: "paid",
      status: { $ne: "cancelled" }
    }).lean()

    if (!testBooking) {
      return NextResponse.json({
        error: "No paid booking found for testing",
        message: "Please create a booking with payment status 'paid' to test refund functionality"
      }, { status: 404 })
    }

    console.log("[Test Refund] Testing refund for booking:", testBooking._id)

    // Test the refund process
    const refundResult = await RefundService.processRefund(
      testBooking._id.toString(),
      session.user.id
    )

    return NextResponse.json({
      message: "Refund test completed",
      bookingId: testBooking._id,
      refundResult
    })

  } catch (error: any) {
    console.error("[Test Refund] Error:", error)
    return NextResponse.json(
      { error: "Failed to test refund", details: error.message },
      { status: 500 }
    )
  }
}