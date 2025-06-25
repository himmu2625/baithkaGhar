import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import Booking from "@/models/Booking"
import { convertDocToObject } from "@/lib/db"
import dbConnect from "@/lib/db/dbConnect"

// Schema for booking update validation
const bookingUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "refunded"]).optional(),
  adminNotes: z.string().optional(),
  refundAmount: z.number().optional(),
})

// Mark routes as dynamic
export const dynamic = 'force-dynamic';

// Get all bookings with filtering options
export async function GET(req: Request) {
  try {
    console.log(`🔍 [GET /api/admin/bookings] Starting request processing...`);
    console.log(`🔍 [GET /api/admin/bookings] Request URL:`, req.url);
    
    // Ensure database connection first
    console.log(`🔍 [GET /api/admin/bookings] Connecting to database...`);
    await dbConnect()
    
    // Add health check parameter for debugging
    const { searchParams } = new URL(req.url)
    const healthCheck = searchParams.get("health")
    
    if (healthCheck === "true") {
      console.log(`🏥 [GET /api/admin/bookings] Health check requested`);
      const count = await Booking.countDocuments()
      return NextResponse.json({ 
        status: "healthy", 
        totalBookings: count,
        timestamp: new Date().toISOString()
      })
    }
    
    // Check if user is authenticated and is an admin
    console.log(`🔍 [GET /api/admin/bookings] Checking authentication...`);
    const session = await auth()

    console.log(`🔍 [GET /api/admin/bookings] Session:`, { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id
    });

    if (!session || !session.user) {
      console.log(`❌ [GET /api/admin/bookings] No session or user`);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      console.log(`❌ [GET /api/admin/bookings] User role ${session.user.role} is not admin`);
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const status = searchParams.get("status")
    const propertyId = searchParams.get("propertyId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    console.log(`🔍 [GET /api/admin/bookings] Query params:`, {
      status, propertyId, userId, startDate, endDate, search, page, limit
    });

    // Build filter object for MongoDB
    const filter: any = {}

    if (status) {
      filter.status = status
    }

    if (propertyId) {
      filter.propertyId = propertyId
    }

    if (userId) {
      filter.userId = userId
    }

    if (startDate || endDate) {
      if (startDate && endDate) {
        filter.$and = [
          { dateFrom: { $lte: new Date(endDate) } },
          { dateTo: { $gte: new Date(startDate) } }
        ]
      } else if (startDate) {
        filter.dateFrom = { $gte: new Date(startDate) }
      } else if (endDate) {
        filter.dateTo = { $lte: new Date(endDate) }
      }
    }

    if (search) {
      const searchConditions = [
        { propertyName: { $regex: search, $options: "i" } },
        { "contactDetails.name": { $regex: search, $options: "i" } },
        { "contactDetails.email": { $regex: search, $options: "i" } }
      ];
      
      if (filter.$and) {
        filter.$and.push({ $or: searchConditions });
      } else {
        filter.$or = searchConditions;
      }
    }

    console.log(`🔍 [GET /api/admin/bookings] MongoDB filter:`, JSON.stringify(filter, null, 2));

    // Test basic database connection first
    console.log(`🔍 [GET /api/admin/bookings] Testing database connection...`);
    const testCount = await Booking.countDocuments();
    console.log(`🔍 [GET /api/admin/bookings] Total bookings in DB: ${testCount}`);

    // Get total count for pagination
    console.log(`🔍 [GET /api/admin/bookings] Getting total count with filter...`);
    const totalBookings = await Booking.countDocuments(filter)
    console.log(`🔍 [GET /api/admin/bookings] Filtered total count: ${totalBookings}`);

    // Get bookings with basic population
    console.log(`🔍 [GET /api/admin/bookings] Fetching bookings...`);
    const bookings = await Booking.find(filter)
      .populate("propertyId", "title address images name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`✅ [GET /api/admin/bookings] Found ${bookings.length} bookings out of ${totalBookings} total`);

    // Simple formatting
    const formattedBookings = bookings.map((booking: any, index: number) => {
      try {
        console.log(`🔄 [GET /api/admin/bookings] Processing booking ${index + 1}/${bookings.length}: ${booking._id}`);
        
        return {
          _id: booking._id,
          bookingCode: `BK-${booking._id.toString().slice(-6).toUpperCase()}`,
          startDate: booking.dateFrom,
          endDate: booking.dateTo,
          guestCount: booking.guests || 1,
          status: booking.status || 'confirmed',
          property: {
            id: booking.propertyId?._id || 'unknown',
            title: booking.propertyId?.title || booking.propertyName || 'Unknown Property',
            location: booking.propertyId?.address?.city || 'Unknown City'
          },
          user: {
            id: booking.userId?._id || booking.userId || 'unknown',
            name: booking.userId?.name || booking.contactDetails?.name || 'Unknown Guest',
            email: booking.userId?.email || booking.contactDetails?.email || 'Unknown Email'
          },
          payment: {
            amount: booking.totalPrice || 0,
            status: booking.paymentStatus || "completed"
          },
          createdAt: booking.createdAt
        };
      } catch (bookingError: any) {
        console.error(`💥 [GET /api/admin/bookings] Error processing booking ${index + 1}:`, bookingError);
        return {
          _id: booking._id,
          bookingCode: `BK-${booking._id.toString().slice(-6).toUpperCase()}`,
          startDate: booking.dateFrom,
          endDate: booking.dateTo,
          guestCount: booking.guests || 1,
          status: booking.status || 'confirmed',
          property: { id: 'unknown', title: 'Unknown Property', location: 'Unknown' },
          user: { id: 'unknown', name: 'Unknown Guest', email: 'Unknown Email' },
          payment: { amount: booking.totalPrice || 0, status: "unknown" },
          createdAt: booking.createdAt
        };
      }
    });

    console.log(`✅ [GET /api/admin/bookings] Successfully formatted ${formattedBookings.length} bookings`);

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        total: totalBookings,
        pages: Math.ceil(totalBookings / limit),
        page,
        limit,
      },
    })
  } catch (error: any) {
    console.error("💥 [GET /api/admin/bookings] Error:", error)
    console.error("💥 [GET /api/admin/bookings] Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to fetch bookings",
      details: error.message
    }, { status: 500 })
  }
}

// Update booking details
export async function PATCH(req: Request) {
  try {
    await dbConnect()
    
    // Check if user is authenticated and is an admin
    const session = await auth()

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = bookingUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 },
      )
    }

    const { id, status, adminNotes, refundAmount } = validationResult.data

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(adminNotes && { adminNotes }),
        ...(refundAmount && { refundAmount }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("propertyId", "title address images price ownerId").populate("userId", "name email")

    if (!updatedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      booking: convertDocToObject(updatedBooking) 
    })
  } catch (error) {
    console.error("Admin booking update error:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
