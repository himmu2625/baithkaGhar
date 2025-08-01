import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/get-session"
import { RefundService } from "@/lib/services/refund-service"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[Refund API] Getting refund status for booking:", id)

    const refundStatus = await RefundService.getRefundStatus(id)

    if (!refundStatus) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(refundStatus)

  } catch (error: any) {
    console.error("[Refund API] Error getting refund status:", error)
    return NextResponse.json(
      { error: "Failed to get refund status" },
      { status: 500 }
    )
  }
}