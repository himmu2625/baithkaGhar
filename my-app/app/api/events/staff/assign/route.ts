import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import EventBooking from "@/models/EventBooking"
import EventStaff from "@/models/EventStaff"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// PUT handler - Assign staff to event booking
export const PUT = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    try {
      const validatedData = assignStaffSchema.parse(body)

      // Validate booking exists
      const booking = await EventBooking.findById(validatedData.bookingId)
        .populate('venueId', 'name')
        .lean() as any

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Event booking not found" },
          { status: 404 }
        )
      }

      // Validate staff members exist and are available
      const staffMembers = await EventStaff.find({
        _id: { $in: validatedData.staffAssignments.map(s => new Types.ObjectId(s.staffId)) },
        propertyId: booking.propertyId,
        isActive: true
      }).lean() as any[]

      if (staffMembers.length !== validatedData.staffAssignments.length) {
        const foundIds = staffMembers.map(s => s._id.toString())
        const requestedIds = validatedData.staffAssignments.map(s => s.staffId)
        const missingIds = requestedIds.filter(id => !foundIds.includes(id))
        
        return NextResponse.json(
          { 
            success: false, 
            message: "Some staff members not found or inactive", 
            missingIds 
          },
          { status: 400 }
        )
      }

      // Check for staff availability conflicts

      // Check each staff member for conflicts
      const conflictChecks = await Promise.all(
        validatedData.staffAssignments.map(async (assignment) => {
          const conflictingBookings = await EventBooking.find({
            _id: { $ne: booking._id },
            'assignedStaff.staffId': new Types.ObjectId(assignment.staffId),
            eventDate: booking.eventDate,
            status: { $nin: ['cancelled', 'completed'] },
            $or: [
              // New assignment overlaps with existing assignment
              {
                startTime: { $lte: booking.startTime },
                endTime: { $gt: booking.startTime }
              },
              {
                startTime: { $lt: booking.endTime },
                endTime: { $gte: booking.endTime }
              },
              {
                startTime: { $gte: booking.startTime },
                endTime: { $lte: booking.endTime }
              }
            ]
          })
          .populate('venueId', 'name')
          .select('eventName bookingNumber startTime endTime venueId')
          .lean() as any[]

          const staffMember = staffMembers.find(s => s._id.toString() === assignment.staffId)
          
          return {
            staffId: assignment.staffId,
            staffName: `${staffMember?.firstName} ${staffMember?.lastName}`,
            role: assignment.role,
            hasConflict: conflictingBookings.length > 0,
            conflicts: conflictingBookings.map(conflict => ({
              bookingId: conflict._id.toString(),
              bookingNumber: conflict.bookingNumber,
              eventName: conflict.eventName,
              venue: conflict.venueId?.name,
              timeSlot: `${conflict.startTime} - ${conflict.endTime}`
            }))
          }
        })
      )

      // Check if any conflicts exist
      const staffWithConflicts = conflictChecks.filter(check => check.hasConflict)
      
      if (staffWithConflicts.length > 0 && !validatedData.forceAssign) {
        return NextResponse.json(
          {
            success: false,
            message: "Staff scheduling conflicts detected",
            conflicts: staffWithConflicts,
            canForceAssign: true
          },
          { status: 409 }
        )
      }

      // Prepare staff assignments with additional details
      const enrichedAssignments = validatedData.staffAssignments.map(assignment => {
        const staffMember = staffMembers.find(s => s._id.toString() === assignment.staffId)
        return {
          staffId: new Types.ObjectId(assignment.staffId),
          role: assignment.role,
          responsibilities: assignment.responsibilities || [],
          startTime: assignment.startTime || booking.startTime,
          endTime: assignment.endTime || booking.endTime,
          hourlyRate: assignment.hourlyRate || staffMember?.hourlyRate || 0,
          isLead: assignment.isLead || false,
          specialInstructions: assignment.specialInstructions || '',
          contactRequired: assignment.contactRequired || false,
          status: 'assigned',
          assignedAt: new Date(),
          assignedBy: new Types.ObjectId(token.sub),
          staffDetails: {
            name: `${staffMember?.firstName} ${staffMember?.lastName}`,
            email: staffMember?.email,
            phone: staffMember?.phone,
            department: staffMember?.department,
            skills: staffMember?.skills || []
          }
        }
      })

      // Update the booking with staff assignments
      const updatedBooking = await EventBooking.findByIdAndUpdate(
        validatedData.bookingId,
        {
          $set: {
            assignedStaff: enrichedAssignments,
            lastUpdatedBy: new Types.ObjectId(token.sub),
            updatedAt: new Date()
          },
          $addToSet: {
            eventTimeline: {
              stage: 'staff_assigned',
              scheduledTime: new Date(),
              actualTime: new Date(),
              status: 'completed',
              notes: `Staff assigned: ${enrichedAssignments.map(a => a.staffDetails.name).join(', ')}`,
              updatedBy: new Types.ObjectId(token.sub)
            }
          }
        },
        { new: true }
      )
      .populate('venueId', 'name capacity')
      .populate('assignedStaff.staffId', 'firstName lastName email phone department')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      // Calculate total staff costs
      const totalStaffHours = enrichedAssignments.reduce((total, assignment) => {
        const start = new Date(`2000-01-01T${assignment.startTime}:00`)
        const end = new Date(`2000-01-01T${assignment.endTime}:00`)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return total + (hours * assignment.hourlyRate)
      }, 0)

      // Update booking totals if needed
      if (totalStaffHours > 0) {
        const updatedPricing = {
          ...booking.pricing,
          staffCharges: totalStaffHours,
          subtotal: (booking.subtotal || 0) - (booking.staffCharges || 0) + totalStaffHours
        }
        updatedPricing.totalAmount = updatedPricing.subtotal + (booking.tax || 0) - (booking.discount || 0)

        await EventBooking.findByIdAndUpdate(
          validatedData.bookingId,
          {
            $set: {
              staffCharges: totalStaffHours,
              subtotal: updatedPricing.subtotal,
              totalAmount: updatedPricing.totalAmount
            }
          }
        )
      }

      // Format response
      const responseData = {
        id: updatedBooking!._id.toString(),
        bookingNumber: updatedBooking!.bookingNumber,
        eventName: updatedBooking!.eventName,
        eventDate: updatedBooking!.eventDate,
        venue: updatedBooking!.venueId,
        assignedStaff: enrichedAssignments.map(assignment => ({
          id: assignment.staffId.toString(),
          name: assignment.staffDetails.name,
          email: assignment.staffDetails.email,
          phone: assignment.staffDetails.phone,
          department: assignment.staffDetails.department,
          role: assignment.role,
          responsibilities: assignment.responsibilities,
          timeSlot: `${assignment.startTime} - ${assignment.endTime}`,
          hourlyRate: assignment.hourlyRate,
          isLead: assignment.isLead,
          status: assignment.status,
          specialInstructions: assignment.specialInstructions,
          contactRequired: assignment.contactRequired,
          assignedAt: assignment.assignedAt,
          skills: assignment.staffDetails.skills
        })),
        staffingInfo: {
          totalStaffMembers: enrichedAssignments.length,
          totalStaffHours: enrichedAssignments.reduce((total, assignment) => {
            const start = new Date(`2000-01-01T${assignment.startTime}:00`)
            const end = new Date(`2000-01-01T${assignment.endTime}:00`)
            return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60))
          }, 0),
          totalStaffCost: totalStaffHours,
          leadStaff: enrichedAssignments.filter(a => a.isLead).map(a => a.staffDetails.name),
          departmentBreakdown: enrichedAssignments.reduce((acc: any, assignment) => {
            const dept = assignment.staffDetails.department || 'General'
            acc[dept] = (acc[dept] || 0) + 1
            return acc
          }, {})
        },
        conflictWarnings: staffWithConflicts.length > 0 ? {
          forced: validatedData.forceAssign || false,
          conflicts: staffWithConflicts
        } : null,
        updatedAt: updatedBooking!.updatedAt,
        lastUpdatedBy: updatedBooking!.lastUpdatedBy
      }

      return NextResponse.json({
        success: true,
        message: "Staff successfully assigned to event",
        booking: responseData
      }, { status: 200 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error assigning staff to event:', error)
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, message: "Invalid booking or staff ID format" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Failed to assign staff to event" },
      { status: 500 }
    )
  }
})

// GET handler - Get staff assignments for a booking
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Valid booking ID is required" },
        { status: 400 }
      )
    }

    const booking = await EventBooking.findById(bookingId)
      .populate('assignedStaff.staffId', 'firstName lastName email phone department skills hourlyRate')
      .populate('assignedStaff.assignedBy', 'name email')
      .select('bookingNumber eventName eventDate startTime endTime assignedStaff staffCharges')
      .lean() as any

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Event booking not found" },
        { status: 404 }
      )
    }

    const staffAssignments = (booking.assignedStaff || []).map((assignment: any) => ({
      id: assignment.staffId?._id?.toString(),
      name: `${assignment.staffId?.firstName} ${assignment.staffId?.lastName}`,
      email: assignment.staffId?.email,
      phone: assignment.staffId?.phone,
      department: assignment.staffId?.department,
      skills: assignment.staffId?.skills || [],
      role: assignment.role,
      responsibilities: assignment.responsibilities || [],
      timeSlot: `${assignment.startTime} - ${assignment.endTime}`,
      hourlyRate: assignment.hourlyRate || assignment.staffId?.hourlyRate || 0,
      isLead: assignment.isLead || false,
      status: assignment.status || 'assigned',
      specialInstructions: assignment.specialInstructions || '',
      contactRequired: assignment.contactRequired || false,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy
    }))

    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        eventName: booking.eventName,
        eventDate: booking.eventDate,
        timeSlot: `${booking.startTime} - ${booking.endTime}`
      },
      staffAssignments,
      summary: {
        totalStaff: staffAssignments.length,
        totalCost: booking.staffCharges || 0,
        leadStaff: staffAssignments.filter((s: any) => s.isLead).length,
        departments: Array.from(new Set(staffAssignments.map((s: any) => s.department).filter(Boolean)))
      }
    })

  } catch (error: any) {
    console.error('Error fetching staff assignments:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch staff assignments" },
      { status: 500 }
    )
  }
})

// Schema for staff assignment validation
const assignStaffSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  staffAssignments: z.array(z.object({
    staffId: z.string().min(1, "Staff ID is required"),
    role: z.enum(['manager', 'coordinator', 'waiter', 'bartender', 'chef', 'security', 'technician', 'cleaner', 'photographer', 'decorator', 'other']),
    responsibilities: z.array(z.string()).default([]),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
    hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
    isLead: z.boolean().default(false),
    specialInstructions: z.string().max(500, "Special instructions cannot exceed 500 characters").optional(),
    contactRequired: z.boolean().default(false)
  })).min(1, "At least one staff assignment is required"),
  forceAssign: z.boolean().default(false),
  notifyStaff: z.boolean().default(true)
}).refine((data) => {
  // Validate that only one staff member is marked as lead per role
  const leadByRole = data.staffAssignments
    .filter(assignment => assignment.isLead)
    .reduce((acc: any, assignment) => {
      acc[assignment.role] = (acc[assignment.role] || 0) + 1
      return acc
    }, {})
  
  return Object.values(leadByRole).every((count: any) => count <= 1)
}, {
  message: "Only one staff member can be marked as lead per role",
  path: ["staffAssignments"]
}).refine((data) => {
  // Validate time consistency if provided
  return data.staffAssignments.every(assignment => {
    if (assignment.startTime && assignment.endTime) {
      const start = new Date(`2000-01-01T${assignment.startTime}:00`)
      const end = new Date(`2000-01-01T${assignment.endTime}:00`)
      return end > start
    }
    return true
  })
}, {
  message: "End time must be after start time for all staff assignments",
  path: ["staffAssignments"]
})