import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { dbHandler } from "@/lib/db"
import { z } from "zod"
import Booking from "@/models/Booking"
import { convertDocToObj } from "@/lib/db"

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
export const GET = dbHandler(async (req: Request) => {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()

    console.log(`🔍 [GET /api/admin/bookings] Session:`, { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userRole: session?.user?.role 
    });

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      console.log(`❌ [GET /api/admin/bookings] Unauthorized - not admin`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const propertyId = searchParams.get("propertyId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
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
      filter.$or = []

      if (startDate && endDate) {
        // Bookings that overlap with the date range
        filter.$and = [
          { dateFrom: { $lte: new Date(endDate) } },
          { dateTo: { $gte: new Date(startDate) } }
        ]
      } else if (startDate) {
        // Bookings that start on or after the start date
        filter.dateFrom = { $gte: new Date(startDate) }
      } else if (endDate) {
        // Bookings that end on or before the end date
        filter.dateTo = { $lte: new Date(endDate) }
      }
    }

    if (search) {
      filter.$or = filter.$or || []
      filter.$or.push(
        { propertyName: { $regex: search, $options: "i" } },
        { "contactDetails.name": { $regex: search, $options: "i" } },
        { "contactDetails.email": { $regex: search, $options: "i" } }
      )
    }

    console.log(`🔍 [GET /api/admin/bookings] MongoDB filter:`, filter);

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter)

    // Get bookings - use the same approach as the working direct bookings API
    const bookings = await Booking.find(filter)
      .populate({
        path: "propertyId",
        select: "title location address images categorizedImages propertyType name"
      })
      .populate({
        path: "userId", 
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`✅ [GET /api/admin/bookings] Found ${bookings.length} bookings out of ${totalBookings} total`);

    // Convert to plain objects and format for admin panel
    const formattedBookings = bookings.map((booking, index) => {
      try {
        console.log(`🔄 [GET /api/admin/bookings] Processing booking ${index + 1}/${bookings.length}:`, booking._id);
        const converted = convertDocToObj(booking);
        
        // Handle property data safely
        let propertyData = null;
        if (converted.propertyId && typeof converted.propertyId === 'object') {
          propertyData = {
            id: converted.propertyId._id || converted.propertyId.id,
            title: converted.propertyId.title || converted.propertyId.name || converted.propertyName || 'Unknown Property',
            location: converted.propertyId.location || converted.propertyId.address?.city || 'Unknown City',
            images: (() => {
              // Safely handle categorizedImages
              if (converted.propertyId.categorizedImages && Array.isArray(converted.propertyId.categorizedImages) && converted.propertyId.categorizedImages.length > 0) {
                const firstCategory = converted.propertyId.categorizedImages[0];
                if (firstCategory && firstCategory.files && Array.isArray(firstCategory.files) && firstCategory.files.length > 0) {
                  return [{ url: firstCategory.files[0].url }];
                }
              }
              // Fallback to regular images array
              if (converted.propertyId.images && Array.isArray(converted.propertyId.images) && converted.propertyId.images.length > 0) {
                const firstImage = converted.propertyId.images[0];
                return [{ url: typeof firstImage === 'string' ? firstImage : firstImage.url }];
              }
              return [];
            })()
          };
        }
        
        // Handle user data safely
        let userData = null;
        if (converted.userId && typeof converted.userId === 'object') {
          userData = {
            id: converted.userId._id || converted.userId.id,
            name: converted.userId.name || converted.contactDetails?.name || 'Unknown Guest',
            email: converted.userId.email || converted.contactDetails?.email || 'Unknown Email'
          };
        } else if (converted.contactDetails) {
          userData = {
            id: converted.userId || 'unknown',
            name: converted.contactDetails.name || 'Unknown Guest',
            email: converted.contactDetails.email || 'Unknown Email'
          };
        }
        
        const result = {
          ...converted,
          bookingCode: `BK-${converted._id.toString().slice(-6).toUpperCase()}`,
          startDate: converted.dateFrom,
          endDate: converted.dateTo,
          guestCount: converted.guests,
          property: propertyData,
          user: userData,
          payment: {
            amount: converted.totalPrice,
            status: converted.paymentStatus || "completed",
            paymentMethod: "razorpay"
          }
        };
        
        console.log(`✅ [GET /api/admin/bookings] Successfully processed booking ${index + 1}`);
        return result;
      } catch (bookingError) {
        console.error(`💥 [GET /api/admin/bookings] Error processing booking ${index + 1}:`, bookingError);
        // Return a safe fallback object
        return {
          _id: (booking as any)._id,
          bookingCode: `BK-${((booking as any)._id).toString().slice(-6).toUpperCase()}`,
          startDate: (booking as any).dateFrom,
          endDate: (booking as any).dateTo,
          guestCount: (booking as any).guests || 1,
          property: {
            id: 'unknown',
            title: (booking as any).propertyName || 'Unknown Property',
            location: 'Unknown Location',
            images: []
          },
          user: {
            id: 'unknown',
            name: (booking as any).contactDetails?.name || 'Unknown Guest',
            email: (booking as any).contactDetails?.email || 'Unknown Email'
          },
          payment: {
            amount: (booking as any).totalPrice || 0,
            status: "unknown",
            paymentMethod: "razorpay"
          }
        };
      }
    });

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        total: totalBookings,
        pages: Math.ceil(totalBookings / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("💥 [GET /api/admin/bookings] Error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
});

// Update booking details
export const PATCH = dbHandler(async (req: Request) => {
  try {
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
    ).populate("propertyId").populate("userId")

    if (!updatedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      booking: convertDocToObj(updatedBooking) 
    })
  } catch (error) {
    console.error("Admin booking update error:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
});
