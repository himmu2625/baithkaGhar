import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";
import { getSession } from "@/lib/get-session";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { convertDocToObj } from "@/lib/db";
import { sendReactEmail } from "@/lib/services/email";

interface Params {
  params: {
    id: string;
  };
}

type PopulatedBooking = {
  _id: mongoose.Types.ObjectId;
  propertyId?: { ownerId?: mongoose.Types.ObjectId };
  userId?: { _id?: mongoose.Types.ObjectId; name?: string; email?: string } | mongoose.Types.ObjectId;
  status?: string;
};

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;
    console.log(`🔍 [GET /api/bookings/${id}] Request received`);
    
    // Get session - try multiple approaches
    let session;
    let userEmail;
    let userId;
    
    try {
      // Try getSession first
      session = await getSession();
      console.log(`🔍 [GET /api/bookings/${id}] Session retrieved successfully via getSession`);
      userEmail = session?.user?.email;
      userId = session?.user?.id;
    } catch (sessionError: any) {
      console.error(`🔍 [GET /api/bookings/${id}] getSession error:`, sessionError);
      
      // Fallback: Try getToken
      try {
        const token = await getToken({ 
          req: req as any, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        console.log(`🔍 [GET /api/bookings/${id}] Token retrieved successfully`);
        userEmail = token?.email;
        userId = token?.sub;
        console.log(`🔍 [GET /api/bookings/${id}] Using token data:`, { userEmail, userId });
      } catch (tokenError: any) {
        console.error(`🔍 [GET /api/bookings/${id}] getToken error:`, tokenError);
        return NextResponse.json({ 
          error: "Authentication error", 
          details: "Both getSession and getToken failed" 
        }, { status: 500 });
      }
    }
    
    console.log(`🔍 [GET /api/bookings/${id}] Session:`, { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: userId,
      userEmail: userEmail
    });

    if (!userEmail) {
      console.log(`❌ [GET /api/bookings/${id}] Unauthorized - no user email`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ [GET /api/bookings/${id}] Invalid booking ID format`);
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    try {
      console.log(`🔍 [GET /api/bookings/${id}] Searching for booking in database...`);
      
      const booking = await Booking.findById(id)
        .populate("propertyId", "title address images categorizedImages legacyGeneralImages price ownerId propertyType generalAmenities otherAmenities")
        .populate("userId", "name email")
        .lean() as PopulatedBooking | null;

      console.log(`🔍 [GET /api/bookings/${id}] Database query result:`, {
        found: !!booking,
        bookingId: booking?._id,
        propertyId: booking?.propertyId,
        userId: booking?.userId
      });

      if (!booking) {
        console.log(`❌ [GET /api/bookings/${id}] Booking not found in database`);
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const isOwner = booking.propertyId?.ownerId?.toString() === userId;
      const isBooker = (booking.userId as any)?._id?.toString() === userId;

      console.log(`🔍 [GET /api/bookings/${id}] Authorization check:`, {
        sessionUserId: userId,
        propertyOwnerId: booking.propertyId?.ownerId?.toString(),
        bookingUserId: (booking.userId as any)?._id?.toString(),
        isOwner,
        isBooker,
        userRole: session?.user?.role
      });

      if (!isOwner && !isBooker && session?.user?.role !== "admin") {
        console.log(`❌ [GET /api/bookings/${id}] Unauthorized - user doesn't own property or booking`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      console.log(`✅ [GET /api/bookings/${id}] Authorization successful, returning booking`);
      return NextResponse.json(convertDocToObj(booking));
    } catch (error: any) {
      console.error(`💥 [GET /api/bookings/${id}] Database error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`💥 [GET /api/bookings/${id}] Outer error:`, error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = params;
    console.log(`🔍 [PATCH /api/bookings/${id}] Request received`);
    console.log(`🔍 [PATCH /api/bookings/${id}] Request headers:`, Object.fromEntries(req.headers.entries()));
    
    // Get session - try multiple approaches
    let session;
    let userEmail;
    let userId;
    
    try {
      // Try getSession first
      session = await getSession();
      console.log(`🔍 [PATCH /api/bookings/${id}] Session retrieved successfully via getSession`);
      userEmail = session?.user?.email;
      userId = session?.user?.id;
    } catch (sessionError: any) {
      console.error(`🔍 [PATCH /api/bookings/${id}] getSession error:`, sessionError);
      
      // Fallback: Try getToken
      try {
        const token = await getToken({ 
          req: req as any, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        console.log(`🔍 [PATCH /api/bookings/${id}] Token retrieved successfully`);
        userEmail = token?.email;
        userId = token?.sub;
        console.log(`🔍 [PATCH /api/bookings/${id}] Using token data:`, { userEmail, userId });
      } catch (tokenError: any) {
        console.error(`🔍 [PATCH /api/bookings/${id}] getToken error:`, tokenError);
        return NextResponse.json({ 
          error: "Authentication error", 
          details: "Both getSession and getToken failed" 
        }, { status: 500 });
      }
    }

    if (!session?.user) {
      console.log(`❌ [PATCH /api/bookings/${id}] Unauthorized - no session or user`);
      console.log(`❌ [PATCH /api/bookings/${id}] Session object:`, session);
      
      // Additional fallback: Try to get user from cookies directly
      try {
        const cookies = req.headers.get('cookie');
        console.log(`🔍 [PATCH /api/bookings/${id}] Cookies:`, cookies);
        
        if (cookies) {
          // Try to extract session token from cookies
          const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
          if (sessionMatch) {
            console.log(`🔍 [PATCH /api/bookings/${id}] Found session token in cookies`);
            // For now, let's return a more specific error
            return NextResponse.json({ 
              error: "Session authentication failed", 
              details: "Please try refreshing the page and logging in again" 
            }, { status: 401 });
          }
        }
      } catch (cookieError) {
        console.error(`🔍 [PATCH /api/bookings/${id}] Cookie parsing error:`, cookieError);
      }
      
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 [PATCH /api/bookings/${id}] Session:`, { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: userId,
      userEmail: userEmail,
      userRole: session?.user?.role,
      userEmailFromSession: session?.user?.email,
      userIdFromSession: session?.user?.id
    });

    try {
      const { status } = await req.json();
      console.log(`🔍 [PATCH /api/bookings/${id}] Request body:`, { status });

      if (!status) {
        console.log(`❌ [PATCH /api/bookings/${id}] Status is required`);
        return NextResponse.json({ error: "Status is required" }, { status: 400 });
      }

      const validStatuses = ["confirmed", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        console.log(`❌ [PATCH /api/bookings/${id}] Invalid status:`, status);
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const booking = await Booking.findById(id)
        .populate("propertyId", "title address images categorizedImages legacyGeneralImages price ownerId propertyType generalAmenities otherAmenities")
        .populate("userId", "name email")
        .lean() as PopulatedBooking | null;

      if (!booking) {
        console.log(`❌ [PATCH /api/bookings/${id}] Booking not found`);
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      console.log(`🔍 [PATCH /api/bookings/${id}] Found booking:`, {
        bookingId: booking._id,
        bookingStatus: booking.status,
        propertyOwnerId: booking.propertyId?.ownerId?.toString(),
        bookingUserId: (booking.userId as any)?._id?.toString(),
        sessionUserId: userId
      });

      const isOwner = booking.propertyId?.ownerId?.toString() === userId;
      const isBooker = (booking.userId as any)?._id?.toString() === userId;
      const isAdmin = session.user.role === "admin" || session.user.role === "super_admin";

      console.log(`🔍 [PATCH /api/bookings/${id}] Authorization check:`, {
        isOwner,
        isBooker,
        isAdmin,
        userRole: session.user.role
      });

      if (status === "cancelled") {
        if (!isOwner && !isBooker && !isAdmin) {
          console.log(`❌ [PATCH /api/bookings/${id}] Unauthorized to cancel booking`);
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        console.log(`🔍 [PATCH /api/bookings/${id}] Calling BookingService.cancelBooking`);
        const cancelledBooking = await BookingService.cancelBooking(id, userId);
        
        if (cancelledBooking) {
          console.log(`✅ [PATCH /api/bookings/${id}] Booking cancelled successfully`);
          return NextResponse.json(cancelledBooking);
        } else {
          console.log(`❌ [PATCH /api/bookings/${id}] Failed to cancel booking`);
          return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
        }
      }

      // For other status updates, only owners and admins can update
      if (!isOwner && !isAdmin) {
        console.log(`❌ [PATCH /api/bookings/${id}] Unauthorized to update booking status`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      console.log(`🔍 [PATCH /api/bookings/${id}] Updating booking status to:`, status);
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("propertyId", "title address images").populate("userId", "name email").lean();

      if (updatedBooking) {
        console.log(`✅ [PATCH /api/bookings/${id}] Booking updated successfully`);
        return NextResponse.json(convertDocToObj(updatedBooking));
      } else {
        console.log(`❌ [PATCH /api/bookings/${id}] Failed to update booking`);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
      }
    } catch (error: any) {
      console.error(`💥 [PATCH /api/bookings/${id}] Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`💥 [PATCH /api/bookings/${id}] Outer error:`, error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
