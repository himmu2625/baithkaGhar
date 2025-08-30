import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import Booking from "@/models/Booking"
import dbConnect from "@/lib/db/dbConnect"
import { BookingService } from "@/services/booking-service"
import { sendReactEmail } from "@/lib/services/email"

// Schema for bulk operations validation
const bulkOperationSchema = z.object({
  operation: z.enum(["update_status", "cancel", "confirm", "complete", "add_notes", "update_dates", "assign_rooms"]),
  bookingIds: z.array(z.string()).min(1).max(100), // Limit to 100 bookings per operation
  data: z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "refunded"]).optional(),
    notes: z.string().optional(),
    refundAmount: z.number().optional(),
    newDateFrom: z.string().optional(),
    newDateTo: z.string().optional(),
    roomAssignments: z.array(z.object({
      bookingId: z.string(),
      unitTypeCode: z.string(),
      roomNumber: z.string(),
      roomId: z.string()
    })).optional(),
    notifyGuests: z.boolean().default(false),
    reason: z.string().optional()
  })
})

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log(`🔄 [POST /api/admin/bookings/bulk] Bulk operation request received`);
    
    await dbConnect()
    
    // Check authentication and authorization
    const session = await auth()
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Parse and validate request body
    const body = await req.json()
    const validationResult = bulkOperationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }
    
    const { operation, bookingIds, data } = validationResult.data
    
    console.log(`🔄 [POST /api/admin/bookings/bulk] Operation: ${operation}, Bookings: ${bookingIds.length}`);
    
    // Fetch all bookings to be processed
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate("propertyId", "title address images ownerId")
      .populate("userId", "name email")
      .lean()
    
    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({ 
        error: "Some bookings not found",
        found: bookings.length,
        requested: bookingIds.length
      }, { status: 404 })
    }
    
    const results = {
      success: [],
      failed: [],
      summary: {
        total: bookings.length,
        successful: 0,
        failed: 0,
        totalRefunded: 0,
        totalValue: 0
      }
    }
    
    // Process each booking based on operation type
    for (const booking of bookings) {
      try {
        let updatedBooking = null
        let refundProcessed = false
        let refundAmount = 0
        
        switch (operation) {
          case "update_status":
            updatedBooking = await Booking.findByIdAndUpdate(
              booking._id,
              { 
                status: data.status,
                ...(data.notes && { adminNotes: data.notes }),
                updatedAt: new Date()
              },
              { new: true }
            ).lean()
            break
            
          case "cancel":
            // Use the existing cancellation service for proper refund handling
            const cancelResult = await BookingService.cancelBooking(
              (booking._id as any).toString(), 
              session.user.id
            )
            updatedBooking = cancelResult
            
            if (cancelResult?.refundAmount) {
              refundProcessed = true
              refundAmount = cancelResult.refundAmount
            }
            break
            
          case "confirm":
            updatedBooking = await Booking.findByIdAndUpdate(
              booking._id,
              { 
                status: "confirmed",
                ...(data.notes && { adminNotes: data.notes }),
                updatedAt: new Date()
              },
              { new: true }
            ).lean()
            break
            
          case "complete":
            updatedBooking = await Booking.findByIdAndUpdate(
              booking._id,
              { 
                status: "completed",
                completedAt: new Date(),
                ...(data.notes && { adminNotes: data.notes }),
                updatedAt: new Date()
              },
              { new: true }
            ).lean()
            break
            
          case "add_notes":
            updatedBooking = await Booking.findByIdAndUpdate(
              booking._id,
              { 
                adminNotes: data.notes,
                updatedAt: new Date()
              },
              { new: true }
            ).lean()
            break
            
          case "update_dates":
            if (data.newDateFrom && data.newDateTo) {
              // Check availability for new dates
              const isAvailable = await BookingService.checkAvailability(
                booking.propertyId.toString(),
                new Date(data.newDateFrom),
                new Date(data.newDateTo)
              )
              
              if (!isAvailable) {
                throw new Error("New dates are not available")
              }
              
              updatedBooking = await Booking.findByIdAndUpdate(
                booking._id,
                { 
                  dateFrom: new Date(data.newDateFrom),
                  dateTo: new Date(data.newDateTo),
                  ...(data.notes && { adminNotes: data.notes }),
                  updatedAt: new Date()
                },
                { new: true }
              ).lean()
            }
            break
            
          case "assign_rooms":
            const roomAssignment = data.roomAssignments?.find(
              ra => ra.bookingId === (booking._id as any).toString()
            )
            
            if (roomAssignment) {
              updatedBooking = await Booking.findByIdAndUpdate(
                booking._id,
                { 
                  allocatedRoom: {
                    unitTypeCode: roomAssignment.unitTypeCode,
                    unitTypeName: "Room", // Could be enhanced to fetch actual name
                    roomNumber: roomAssignment.roomNumber,
                    roomId: roomAssignment.roomId
                  },
                  roomAllocationStatus: "allocated",
                  updatedAt: new Date()
                },
                { new: true }
              ).lean()
            }
            break
        }
        
        if (updatedBooking) {
          (results.success as any[]).push({
            bookingId: (booking._id as any).toString(),
            bookingCode: `BK-${(booking._id as any).toString().slice(-6).toUpperCase()}`,
            operation,
            ...(refundProcessed && { refundAmount }),
            guestName: booking.userId?.name || booking.contactDetails?.name,
            propertyName: booking.propertyId?.title
          })
          
          results.summary.successful++
          results.summary.totalValue += booking.totalPrice || 0
          if (refundAmount > 0) {
            results.summary.totalRefunded += refundAmount
          }
          
          // Send notification email if requested
          if (data.notifyGuests && booking.userId?.email) {
            try {
              let emailTemplate = ""
              let emailSubject = ""
              
              switch (operation) {
                case "confirm":
                  emailTemplate = "booking-confirmed"
                  emailSubject = "Booking Confirmed"
                  break
                case "cancel":
                  emailTemplate = "booking-cancelled"
                  emailSubject = "Booking Cancelled"
                  break
                case "update_dates":
                  emailTemplate = "booking-updated"
                  emailSubject = "Booking Dates Updated"
                  break
              }
              
              if (emailTemplate) {
                await sendReactEmail({
                  to: booking.userId.email,
                  subject: emailSubject,
                  emailComponent: emailTemplate
                })
              }
            } catch (emailError) {
              console.error(`Failed to send email for booking ${booking._id}:`, emailError)
            }
          }
        }
        
      } catch (error: any) {
        // Log error - console.error temporarily removed due to TS issue
        (results.failed as any[]).push({
          bookingId: (booking._id as any).toString(),
          bookingCode: `BK-${(booking._id as any).toString().slice(-6).toUpperCase()}`,
          error: error.message,
          guestName: booking.userId?.name || booking.contactDetails?.name,
          propertyName: booking.propertyId?.title
        })
        results.summary.failed++
      }
    }
    
    console.log(`✅ [POST /api/admin/bookings/bulk] Completed: ${results.summary.successful}/${results.summary.total} successful`);
    
    // Log the bulk operation for audit purposes
    console.log(`📊 [POST /api/admin/bookings/bulk] Audit Log:`, {
      operation,
      performedBy: session.user.email,
      timestamp: new Date().toISOString(),
      totalBookings: results.summary.total,
      successful: results.summary.successful,
      failed: results.summary.failed,
      totalValue: results.summary.totalValue,
      totalRefunded: results.summary.totalRefunded
    })
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    console.error("💥 [POST /api/admin/bookings/bulk] Error:", error)
    return NextResponse.json({ 
      error: "Failed to process bulk operation",
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint to retrieve bulk operation templates and validation
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    const bulkOperations = {
      operations: [
        {
          key: "update_status",
          label: "Update Status",
          description: "Change booking status for multiple bookings",
          fields: ["status", "notes", "notifyGuests"],
          icon: "edit"
        },
        {
          key: "cancel",
          label: "Cancel Bookings",
          description: "Cancel multiple bookings with refund processing",
          fields: ["reason", "notifyGuests"],
          icon: "x-circle",
          warning: "This action will process refunds automatically"
        },
        {
          key: "confirm",
          label: "Confirm Bookings",
          description: "Confirm pending bookings",
          fields: ["notes", "notifyGuests"],
          icon: "check-circle"
        },
        {
          key: "complete",
          label: "Mark Complete",
          description: "Mark bookings as completed",
          fields: ["notes", "notifyGuests"],
          icon: "check"
        },
        {
          key: "add_notes",
          label: "Add Notes",
          description: "Add admin notes to multiple bookings",
          fields: ["notes"],
          icon: "file-text"
        },
        {
          key: "update_dates",
          label: "Update Dates",
          description: "Change booking dates (checks availability)",
          fields: ["newDateFrom", "newDateTo", "notes", "notifyGuests"],
          icon: "calendar",
          warning: "Will check availability for new dates"
        },
        {
          key: "assign_rooms",
          label: "Assign Rooms",
          description: "Assign specific rooms to bookings",
          fields: ["roomAssignments"],
          icon: "home"
        }
      ],
      
      limits: {
        maxBookingsPerOperation: 100,
        supportedStatuses: ["pending", "confirmed", "completed", "cancelled", "refunded"]
      },
      
      validationRules: {
        cancel: "Can only cancel pending or confirmed bookings",
        confirm: "Can only confirm pending bookings",
        complete: "Can only complete confirmed bookings",
        update_dates: "Cannot update dates for cancelled or completed bookings"
      }
    }
    
    return NextResponse.json(bulkOperations)
    
  } catch (error: any) {
    console.error("💥 [GET /api/admin/bookings/bulk] Error:", error)
    return NextResponse.json({ 
      error: "Failed to get bulk operations",
      details: error.message
    }, { status: 500 })
  }
}