import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dbHandler } from "@/lib/db"
import Booking from "@/models/Booking"
import { convertDocToObject } from "@/lib/db"

// Mark routes as dynamic
export const dynamic = 'force-dynamic';

// Get all payments with filtering options
export const GET = dbHandler(async (req: Request) => {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()

    console.log(`🔍 [GET /api/admin/payments] Session:`, { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userRole: session?.user?.role 
    });

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      console.log(`❌ [GET /api/admin/payments] Unauthorized - not admin`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    console.log(`🔍 [GET /api/admin/payments] Query params:`, {
      status, startDate, endDate, search, page, limit
    });

    // Build filter object for MongoDB
    const filter: any = {}

    // Only include bookings with payments (non-zero totalPrice)
    filter.totalPrice = { $gt: 0 }

    if (status && status !== "all") {
      // Map payment status filter
      switch (status) {
        case "completed":
          filter.paymentStatus = { $in: ["completed", "paid"] }
          break;
        case "pending":
          filter.paymentStatus = { $in: ["pending", "processing"] }
          break;
        case "failed":
          filter.paymentStatus = "failed"
          break;
        case "refunded":
          filter.$or = [
            { paymentStatus: "refunded" },
            { status: "refunded" }
          ]
          break;
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate)
      }
    }

    console.log(`🔍 [GET /api/admin/payments] MongoDB filter:`, filter);

    // Get total count for pagination
    const totalPayments = await Booking.countDocuments(filter)

    // Get bookings with payment information
    const bookings = await Booking.find(filter)
      .populate({
        path: "propertyId",
        select: "title name"
      })
      .populate({
        path: "userId", 
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`✅ [GET /api/admin/payments] Found ${bookings.length} payments out of ${totalPayments} total`);
    console.log(`🔍 [GET /api/admin/payments] Sample booking structure:`, bookings[0] ? {
      _id: bookings[0]._id,
      totalPrice: bookings[0].totalPrice,
      paymentStatus: bookings[0].paymentStatus,
      hasPropertyId: !!bookings[0].propertyId,
      hasUserId: !!bookings[0].userId
    } : 'No bookings found');

    // Convert to payment format for admin panel
    const payments = bookings.map((booking: any, index: number) => {
      try {
        const converted = convertDocToObject(booking);
        
        // Safely get booking ID - try multiple sources
        const bookingId = converted._id || 
                         booking._id || 
                         converted.id || 
                         booking.id || 
                         `temp-${Date.now()}-${index}`;
        
        console.log(`🔍 [Payment ${index + 1}] Processing booking ID:`, bookingId);
        
        // Handle property data
        const propertyName = converted.propertyId?.title || 
                            converted.propertyId?.name || 
                            converted.propertyName || 
                            'Unknown Property';
        
        // Handle user data
        const guestName = converted.userId?.name || 
                         converted.contactDetails?.name || 
                         'Unknown Guest';
        
        // Map payment status
        let paymentStatus = "completed";
        if (converted.paymentStatus) {
          switch (converted.paymentStatus) {
            case "pending":
            case "processing":
              paymentStatus = "pending";
              break;
            case "failed":
              paymentStatus = "failed";
              break;
            case "refunded":
              paymentStatus = "refunded";
              break;
            case "completed":
            case "paid":
            default:
              paymentStatus = "completed";
              break;
          }
        }
        
        // Override status if booking is refunded
        if (converted.status === "refunded") {
          paymentStatus = "refunded";
        }

        // Safely create payment ID
        const paymentIdSuffix = typeof bookingId === 'string' ? 
          bookingId.slice(-6).toUpperCase() : 
          bookingId.toString().slice(-6).toUpperCase();

        return {
          id: `PAY-${paymentIdSuffix}`,
          bookingId: `BK-${paymentIdSuffix}`,
          propertyName,
          guestName,
          guestEmail: converted.userId?.email || converted.contactDetails?.email || 'Unknown Email',
          amount: converted.totalPrice || 0,
          status: paymentStatus,
          paymentMethod: converted.paymentMethod || "razorpay",
          paymentId: converted.razorpayPaymentId || converted.paymentId || null,
          date: converted.createdAt || new Date().toISOString(),
          bookingDetails: {
            dateFrom: converted.dateFrom,
            dateTo: converted.dateTo,
            guests: converted.guests
          }
        };
      } catch (paymentError: any) {
        console.error(`💥 [Payment ${index + 1}] Error processing payment:`, paymentError);
        // Return fallback payment data
        return {
          id: `PAY-ERROR-${index}`,
          bookingId: `BK-ERROR-${index}`,
          propertyName: 'Error Loading Property',
          guestName: 'Error Loading Guest',
          guestEmail: 'error@loading.com',
          amount: 0,
          status: 'failed',
          paymentMethod: 'unknown',
          paymentId: null,
          date: new Date().toISOString(),
          bookingDetails: {
            dateFrom: null,
            dateTo: null,
            guests: 0
          }
        };
      }
    });

    // Filter by search query if provided
    let filteredPayments = payments;
    if (search) {
      const query = search.toLowerCase();
      filteredPayments = payments.filter((payment: any) =>
        payment.id.toLowerCase().includes(query) ||
        payment.bookingId.toLowerCase().includes(query) ||
        payment.propertyName.toLowerCase().includes(query) ||
        payment.guestName.toLowerCase().includes(query) ||
        payment.guestEmail.toLowerCase().includes(query)
      );
    }

    // Calculate summary statistics
    const completedPayments = payments.filter((p: any) => p.status === "completed");
    const pendingPayments = payments.filter((p: any) => p.status === "pending");
    const refundedPayments = payments.filter((p: any) => p.status === "refunded");
    
    const summary = {
      totalRevenue: completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingAmount: pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
      refundedAmount: refundedPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
      totalTransactions: payments.length,
      completedCount: completedPayments.length,
      pendingCount: pendingPayments.length,
      failedCount: payments.filter((p: any) => p.status === "failed").length,
      refundedCount: refundedPayments.length
    };

    console.log(`✅ [GET /api/admin/payments] Successfully processed ${payments.length} payments`);
    console.log(`💰 [GET /api/admin/payments] Payment summary:`, {
      totalRevenue: `₹${summary.totalRevenue}`,
      pendingAmount: `₹${summary.pendingAmount}`,
      totalTransactions: summary.totalTransactions,
      completedCount: summary.completedCount,
      pendingCount: summary.pendingCount
    });

    return NextResponse.json({
      payments: filteredPayments,
      summary,
      pagination: {
        total: totalPayments,
        pages: Math.ceil(totalPayments / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("💥 [GET /api/admin/payments] Error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}); 